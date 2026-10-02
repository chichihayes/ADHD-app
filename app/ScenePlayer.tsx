"use client";

import { useEffect, useState } from "react";
import { PoseName, StickFigure } from "./StickFigure";
import { PropName, SceneProps } from "./SceneProps";

export type SceneStep = { pose: PoseName; props: PropName[]; caption: string; seconds: number };

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

  const progress = ((index + 1) / scenes.length) * 100;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Stage - the figure and this beat's elements fill the screen */}
      <div className="flex h-full w-full items-center justify-center">
        <div className="scale-150 sm:scale-[2.2]">
          <StickFigure pose={current.pose} x={x} />
        </div>
      </div>
      <SceneProps props={current.props} />

      {/* Subtitle */}
      <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-6">
        <p className="rounded-lg bg-black/60 px-4 py-2 text-center text-lg text-white sm:text-xl">{current.caption}</p>
      </div>

      {/* Thin progress bar */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
        <div className="h-full bg-purple-400 transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Play/pause/replay control */}
      <button
        onClick={atEnd ? replay : () => setPlaying((p) => !p)}
        className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
        aria-label={atEnd ? "Replay" : playing ? "Pause" : "Play"}
      >
        {atEnd ? "↺" : playing ? "❙❙" : "▶"}
      </button>
    </div>
  );
}
