import { NextRequest, NextResponse } from "next/server";
import { SCENE_MODEL, STICK_POSES, sceneSystemPrompt, sceneUserPrompt } from "@/src/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 30;

type RawScene = { pose?: string; caption?: string; seconds?: number };

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing OPENROUTER_API_KEY." }, { status: 500 });
  }

  let body: { story?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { story } = body;
  if (!story) {
    return NextResponse.json({ error: "story is required." }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

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
        model: SCENE_MODEL,
        messages: [
          { role: "system", content: sceneSystemPrompt() },
          { role: "user", content: sceneUserPrompt(story) },
        ],
      }),
      signal: controller.signal,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Scene model request failed.");
    }
    const raw: string | undefined = data?.choices?.[0]?.message?.content;
    if (!raw) {
      throw new Error("No response from scene model.");
    }

    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error("Scene model didn't return a JSON array.");
    }

    const parsed = JSON.parse(match[0]) as RawScene[];
    const allowedPoses = new Set<string>(STICK_POSES);
    const scenes = parsed
      .filter((s): s is Required<RawScene> => !!s && typeof s.caption === "string" && allowedPoses.has(s.pose ?? ""))
      .map((s) => ({
        pose: s.pose,
        caption: s.caption.slice(0, 140),
        seconds: Math.min(6, Math.max(2, Number(s.seconds) || 3)),
      }))
      .slice(0, 8);

    if (scenes.length === 0) {
      throw new Error("No valid scenes came back.");
    }

    return NextResponse.json({ scenes });
  } catch (err) {
    return NextResponse.json(
      { error: `Oops! Couldn't turn that into stick figures. Can you try again? (Error: ${String(err)})` },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
