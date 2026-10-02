"use client";

import { useEffect, useState } from "react";
import { PoseName, StickFigure } from "./StickFigure";

export type SceneStep = { pose: PoseName; caption: string; seconds: number };

export function ScenePlayer({ scenes }: { scenes: SceneStep[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [x, setX] = useState(0);

  const current = scenes[index];
  const atEnd = index >= scenes.length - 1;

  useEffect(() => {
    if (!playing || !current || atEnd) return;
    const ms = Math.max(1200, current.seconds * 1000);
    const id = setTimeout(() => setIndex((i) => Math.min(i + 1, scenes.length - 1)), ms);
    return () => clearTimeout(id);
  }, [index, playing, current, atEnd, scenes.length]);

  useEffect(() => {
    if (atEnd) setPlaying(false);
  }, [atEnd]);

  useEffect(() => {
    if (!current) return;
    if (current.pose === "walk") setX((prev) => prev + 40);
    else if (current.pose === "run") setX((prev) => prev + 70);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function replay() {
    setIndex(0);
    setX(0);
    setPlaying(true);
  }

  if (!current) return null;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <StickFigure pose={current.pose} x={x} />
      </div>

      <p className="min-h-[1.5rem] max-w-md text-center text-blue-100">{current.caption}</p>

      <div className="flex items-center gap-1.5">
        {scenes.map((_, i) => (
          <span key={i} className={`h-1.5 w-6 rounded-full ${i <= index ? "bg-purple-400" : "bg-white/15"}`} />
        ))}
      </div>

      <div className="flex gap-2">
        {atEnd ? (
          <button
            onClick={replay}
            className="rounded-lg bg-purple-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-600"
          >
            Replay
          </button>
        ) : (
          <button
            onClick={() => setPlaying((p) => !p)}
            className="rounded-lg border border-white/20 px-4 py-1.5 text-sm text-blue-100 hover:bg-white/10"
          >
            {playing ? "Pause" : "Play"}
          </button>
        )}
      </div>
    </div>
  );
}
