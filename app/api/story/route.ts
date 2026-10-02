import { NextRequest, NextResponse } from "next/server";
import { STORY_PANEL_MODELS, masterStorySystemPrompt, masterStoryUserPrompt } from "@/src/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

const WRITER_TIMEOUT_MS = 25000;
const MASTER_TIMEOUT_MS = 30000;

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
    return NextResponse.json(
      { error: "None of the writers responded in time. Can you try again?" },
      { status: 502 }
    );
  }

  // The master voice reads every attempt and streams the single final story
  // straight through to the browser as it writes it, instead of making the
  // reader wait for the whole thing to finish first.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MASTER_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://adhd-learning-companion.vercel.app",
        "X-Title": "ADHD Learning Companion",
      },
      body: JSON.stringify({
        model: STORY_PANEL_MODELS.master,
        messages: [
          { role: "system", content: masterStorySystemPrompt(systemPrompt) },
          { role: "user", content: masterStoryUserPrompt(currentTopic, interestText, drafts) },
        ],
        stream: true,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    return NextResponse.json(
      { error: `Oops! The master writer didn't respond. Can you try again? (Error: ${String(err)})` },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    clearTimeout(timer);
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(
      { error: data?.error?.message || "Master model request failed." },
      { status: upstream.status || 502 }
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(streamController) {
      const reader = upstream.body!.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta: string | undefined = json?.choices?.[0]?.delta?.content;
              if (delta) streamController.enqueue(encoder.encode(delta));
            } catch {
              // partial/malformed SSE chunk - wait for more data
            }
          }
        }
        streamController.close();
      } catch (err) {
        streamController.error(err);
      } finally {
        clearTimeout(timer);
      }
    },
    cancel() {
      clearTimeout(timer);
      controller.abort();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
