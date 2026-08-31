import { NextRequest, NextResponse } from "next/server";
import { OPENROUTER_MODEL } from "@/src/lib/prompts";

export const runtime = "nodejs";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing OPENROUTER_API_KEY." },
      { status: 500 }
    );
  }

  let body: { systemPrompt?: string; userPrompt?: string; history?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { systemPrompt, userPrompt, history = [] } = body;
  if (!systemPrompt || !userPrompt) {
    return NextResponse.json(
      { error: "systemPrompt and userPrompt are required." },
      { status: 400 }
    );
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userPrompt },
  ];

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://adhd-learning-companion.vercel.app",
        "X-Title": "ADHD Learning Companion",
      },
      body: JSON.stringify({ model: OPENROUTER_MODEL, messages }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenRouter request failed." },
        { status: upstream.status }
      );
    }

    const aiResponse: string | undefined = data?.choices?.[0]?.message?.content;
    if (!aiResponse) {
      return NextResponse.json({ error: "No response from model." }, { status: 502 });
    }

    return NextResponse.json({ response: aiResponse });
  } catch (err) {
    return NextResponse.json(
      { error: `Oops! I'm having trouble thinking right now. Can you try again? (Error: ${String(err)})` },
      { status: 502 }
    );
  }
}
