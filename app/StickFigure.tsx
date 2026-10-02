"use client";

import { useEffect, useRef, useState } from "react";
import { STICK_POSES } from "@/src/lib/prompts";

export type PoseName = (typeof STICK_POSES)[number];

type Pt = { x: number; y: number };
type Pose = { head: Pt; neck: Pt; hip: Pt; handL: Pt; handR: Pt; footL: Pt; footR: Pt };

const STATIC_POSES: Record<Exclude<PoseName, "walk" | "run">, Pose> = {
  stand: {
    head: { x: 100, y: 40 }, neck: { x: 100, y: 55 }, hip: { x: 100, y: 110 },
    handL: { x: 75, y: 90 }, handR: { x: 125, y: 90 }, footL: { x: 85, y: 170 }, footR: { x: 115, y: 170 },
  },
  point: {
    head: { x: 100, y: 40 }, neck: { x: 100, y: 55 }, hip: { x: 100, y: 110 },
    handL: { x: 85, y: 95 }, handR: { x: 158, y: 58 }, footL: { x: 85, y: 170 }, footR: { x: 115, y: 170 },
  },
  wave: {
    head: { x: 100, y: 40 }, neck: { x: 100, y: 55 }, hip: { x: 100, y: 110 },
    handL: { x: 85, y: 95 }, handR: { x: 138, y: 26 }, footL: { x: 85, y: 170 }, footR: { x: 115, y: 170 },
  },
  think: {
    head: { x: 100, y: 40 }, neck: { x: 100, y: 55 }, hip: { x: 100, y: 110 },
    handL: { x: 85, y: 95 }, handR: { x: 96, y: 46 }, footL: { x: 85, y: 170 }, footR: { x: 115, y: 170 },
  },
  sit: {
    head: { x: 100, y: 70 }, neck: { x: 100, y: 85 }, hip: { x: 100, y: 120 },
    handL: { x: 80, y: 112 }, handR: { x: 120, y: 112 }, footL: { x: 66, y: 150 }, footR: { x: 134, y: 150 },
  },
  jump: {
    head: { x: 100, y: 20 }, neck: { x: 100, y: 36 }, hip: { x: 100, y: 88 },
    handL: { x: 66, y: 16 }, handR: { x: 134, y: 16 }, footL: { x: 85, y: 130 }, footR: { x: 115, y: 130 },
  },
  cheer: {
    head: { x: 100, y: 35 }, neck: { x: 100, y: 50 }, hip: { x: 100, y: 105 },
    handL: { x: 68, y: 14 }, handR: { x: 132, y: 14 }, footL: { x: 85, y: 165 }, footR: { x: 115, y: 165 },
  },
};

const WALK_FRAMES: [Pose, Pose] = [
  {
    head: { x: 100, y: 40 }, neck: { x: 100, y: 55 }, hip: { x: 100, y: 110 },
    handL: { x: 82, y: 95 }, handR: { x: 118, y: 85 }, footL: { x: 82, y: 170 }, footR: { x: 118, y: 164 },
  },
  {
    head: { x: 100, y: 40 }, neck: { x: 100, y: 55 }, hip: { x: 100, y: 110 },
    handL: { x: 118, y: 85 }, handR: { x: 82, y: 95 }, footL: { x: 118, y: 164 }, footR: { x: 82, y: 170 },
  },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const out = {} as Pose;
  (Object.keys(a) as (keyof Pose)[]).forEach((k) => {
    out[k] = { x: lerp(a[k].x, b[k].x, t), y: lerp(a[k].y, b[k].y, t) };
  });
  return out;
}

function targetPoseFor(pose: PoseName, frame: number): Pose {
  if (pose === "walk" || pose === "run") return WALK_FRAMES[frame % 2];
  return STATIC_POSES[pose];
}

export function StickFigure({ pose, x = 0 }: { pose: PoseName; x?: number }) {
  const [frame, setFrame] = useState(0);
  const [displayed, setDisplayed] = useState<Pose>(STATIC_POSES.stand);
  const fromRef = useRef<Pose>(STATIC_POSES.stand);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (pose !== "walk" && pose !== "run") return;
    const ms = pose === "run" ? 150 : 280;
    const id = setInterval(() => setFrame((f) => f + 1), ms);
    return () => clearInterval(id);
  }, [pose]);

  useEffect(() => {
    const target = targetPoseFor(pose, frame);
    const start = fromRef.current;
    const startTime = performance.now();
    const duration = pose === "walk" || pose === "run" ? 200 : 300;

    function step(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      setDisplayed(lerpPose(start, target, t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pose, frame]);

  const p = displayed;

  return (
    <svg
      viewBox="0 0 200 200"
      className="h-48 w-48"
      style={{ transform: `translateX(${x}px)`, transition: "transform 1.1s linear" }}
    >
      <circle cx={p.head.x} cy={p.head.y} r={14} fill="none" stroke="white" strokeWidth={4} />
      <line x1={p.neck.x} y1={p.neck.y} x2={p.hip.x} y2={p.hip.y} stroke="white" strokeWidth={4} strokeLinecap="round" />
      <line x1={p.neck.x} y1={p.neck.y} x2={p.handL.x} y2={p.handL.y} stroke="white" strokeWidth={4} strokeLinecap="round" />
      <line x1={p.neck.x} y1={p.neck.y} x2={p.handR.x} y2={p.handR.y} stroke="white" strokeWidth={4} strokeLinecap="round" />
      <line x1={p.hip.x} y1={p.hip.y} x2={p.footL.x} y2={p.footL.y} stroke="white" strokeWidth={4} strokeLinecap="round" />
      <line x1={p.hip.x} y1={p.hip.y} x2={p.footR.x} y2={p.footR.y} stroke="white" strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}
