"use client";

import { PoseName } from "./StickFigure";

const STROKE = "white";

function SpeedLines({ fast }: { fast: boolean }) {
  const lines = fast ? [0, 1, 2, 3] : [0, 1, 2];
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-[90px] -translate-y-1/2">
      {lines.map((i) => (
        <div
          key={i}
          className="animate-speedline"
          style={{ animationDelay: `${i * (fast ? 70 : 120)}ms`, marginTop: i % 2 === 0 ? -14 * i : 10 * i }}
        >
          <svg viewBox="0 0 40 6" className="h-1.5 w-10">
            <line x1="0" y1="3" x2="40" y2="3" stroke={STROKE} strokeWidth={3} strokeLinecap="round" />
          </svg>
        </div>
      ))}
    </div>
  );
}

function ImpactBurst() {
  return (
    <div className="animate-impact absolute bottom-10 left-1/2 -translate-x-1/2">
      <svg viewBox="0 0 100 100" className="h-16 w-16">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 50 + 14 * Math.cos(rad);
          const y1 = 50 + 14 * Math.sin(rad);
          const x2 = 50 + 34 * Math.cos(rad);
          const y2 = 50 + 34 * Math.sin(rad);
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={STROKE} strokeWidth={4} strokeLinecap="round" />;
        })}
      </svg>
    </div>
  );
}

export function MotionEffects({ pose }: { pose: PoseName }) {
  if (pose === "run") return <SpeedLines fast />;
  if (pose === "walk") return <SpeedLines fast={false} />;
  if (pose === "jump" || pose === "cheer") return <ImpactBurst />;
  return null;
}
