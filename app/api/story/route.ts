import { NextRequest, NextResponse } from "next/server";
import { STORY_MODEL } from "@/src/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing OPENROUTER_API_KEY." }, { status: 500 });
  }

  let body: { systemPrompt?: string; userPrompt?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { systemPrompt, userPrompt, model } = body;
  if (!systemPrompt || !userPrompt) {
    return NextResponse.json({ error: "systemPrompt and userPrompt are required." }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

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
        model: model || STORY_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    return NextResponse.json(
      { error: `Oops! The storyteller didn't respond. Can you try again? (Error: ${String(err)})` },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    clearTimeout(timer);
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(
      { error: data?.error?.message || "Story model request failed." },
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
