import { NextRequest, NextResponse } from "next/server";
import { STORY_PANEL_MODELS } from "@/src/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_ROUNDS = 1;
const WRITER_TIMEOUT_MS = 20000;
const CRITIC_TIMEOUT_MS = 12000;

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

function critiquePrompt(storyRules: string, draft: string) {
  return `A draft story was written to teach a concept through something the reader is personally into.

Draft:
"""
${draft}
"""

It's supposed to follow these rules:
${storyRules}

Read it as a strict, honest editor. The bar is not "does it start well" - it's "would someone who doesn't want to be taught keep reading all the way to the very last sentence, with zero urge to stop partway through"? Does it ever sag, get preachy, or feel like it's just finishing a checklist instead of finishing a story? Is it grounded in something real rather than generic? Is it simple and small, not a lecture?

Reply with exactly one of these two formats, nothing else:
APPROVE
REVISE: <the single biggest thing wrong with it, one sentence>`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing OPENROUTER_API_KEY." }, { status: 500 });
  }

  let body: { systemPrompt?: string; userPrompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { systemPrompt, userPrompt } = body;
  if (!systemPrompt || !userPrompt) {
    return NextResponse.json({ error: "systemPrompt and userPrompt are required." }, { status: 400 });
  }

  try {
    let draft = await callModel(apiKey, STORY_PANEL_MODELS.writer, systemPrompt, userPrompt, WRITER_TIMEOUT_MS);

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const verdicts = await Promise.allSettled(
        STORY_PANEL_MODELS.critics.map((model) =>
          callModel(
            apiKey,
            model,
            "You are a sharp, honest story editor.",
            critiquePrompt(systemPrompt, draft),
            CRITIC_TIMEOUT_MS
          )
        )
      );

      // A critic that times out or errors doesn't get to block the story - treat it as a pass.
      const requestedChanges = verdicts
        .filter((v): v is PromiseFulfilledResult<string> => v.status === "fulfilled")
        .map((v) => v.value.trim())
        .filter((v) => !/^APPROVE/i.test(v));

      if (requestedChanges.length === 0) break;

      const revisePrompt = `${userPrompt}

Your previous draft:
"""
${draft}
"""

A panel of editors reviewed it and asked for these changes:
${requestedChanges.map((r) => `- ${r.replace(/^REVISE:\s*/i, "")}`).join("\n")}

Rewrite the story addressing their feedback, while still following all the original rules.`;

      draft = await callModel(apiKey, STORY_PANEL_MODELS.writer, systemPrompt, revisePrompt, WRITER_TIMEOUT_MS);
    }

    return NextResponse.json({ response: draft });
  } catch (err) {
    return NextResponse.json(
      { error: `Oops! The panel couldn't agree. Can you try again? (Error: ${String(err)})` },
      { status: 502 }
    );
  }
}
