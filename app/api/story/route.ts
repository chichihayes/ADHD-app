import { NextRequest, NextResponse } from "next/server";
import { STORY_PANEL_MODELS, masterStorySystemPrompt, masterStoryUserPrompt } from "@/src/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

const WRITER_TIMEOUT_MS = 25000;
const MASTER_TIMEOUT_MS = 25000;

async function callModel(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://adhd-learning-companion.vercel.app",
        "X-Title": "ADHD Learning Companion",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || `${model} request failed`);
    }
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(`No response from ${model}`);
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`${model} timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing OPENROUTER_API_KEY." }, { status: 500 });
  }

  let body: { systemPrompt?: string; userPrompt?: string; currentTopic?: string; interestText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { systemPrompt, userPrompt, currentTopic, interestText } = body;
  if (!systemPrompt || !userPrompt || !currentTopic || !interestText) {
    return NextResponse.json(
      { error: "systemPrompt, userPrompt, currentTopic and interestText are required." },
      { status: 400 }
    );
  }

  try {
    // All four writers draft independently and in parallel - a slow or failed one doesn't block the rest.
    const results = await Promise.allSettled(
      STORY_PANEL_MODELS.writers.map((model) =>
        callModel(apiKey, model, systemPrompt, userPrompt, WRITER_TIMEOUT_MS)
      )
    );

    const drafts = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map((r) => r.value);

    if (drafts.length === 0) {
      throw new Error("None of the writers responded in time.");
    }

    // One master voice reads every attempt and writes the single final story.
    const finalStory = await callModel(
      apiKey,
      STORY_PANEL_MODELS.master,
      masterStorySystemPrompt(systemPrompt),
      masterStoryUserPrompt(currentTopic, interestText, drafts),
      MASTER_TIMEOUT_MS
    );

    return NextResponse.json({ response: finalStory });
  } catch (err) {
    return NextResponse.json(
      { error: `Oops! The writers couldn't get it together. Can you try again? (Error: ${String(err)})` },
      { status: 502 }
    );
  }
}
