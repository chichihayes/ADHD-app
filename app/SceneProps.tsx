"use client";

import { STICK_PROPS } from "@/src/lib/prompts";
import { StickFigure } from "./StickFigure";

export type PropName = (typeof STICK_PROPS)[number];

const STROKE = "white";
const W = 3;

function Ball() {
  return (
    <svg viewBox="0 0 60 60" className="h-10 w-10">
      <circle cx="30" cy="30" r="20" fill="none" stroke={STROKE} strokeWidth={W} />
      <path d="M14 22 Q30 30 46 22" fill="none" stroke={STROKE} strokeWidth={W - 1} />
      <path d="M14 38 Q30 30 46 38" fill="none" stroke={STROKE} strokeWidth={W - 1} />
    </svg>
  );
}

function Goal() {
  return (
    <svg viewBox="0 0 90 70" className="h-16 w-20">
      <path d="M8 66 V8 H82 V66" fill="none" stroke={STROKE} strokeWidth={W} />
      <path d="M8 24 L82 8 M8 40 L82 24 M8 56 L82 40" fill="none" stroke={STROKE} strokeWidth={1.5} opacity={0.6} />
    </svg>
  );
}

function Table() {
  return (
    <svg viewBox="0 0 70 50" className="h-10 w-14">
      <line x1="6" y1="18" x2="64" y2="18" stroke={STROKE} strokeWidth={W} />
      <line x1="12" y1="18" x2="12" y2="44" stroke={STROKE} strokeWidth={W} />
      <line x1="58" y1="18" x2="58" y2="44" stroke={STROKE} strokeWidth={W} />
    </svg>
  );
}

function Cup() {
  return (
    <svg viewBox="0 0 40 50" className="h-8 w-7">
      <path d="M10 10 L30 10 L26 42 L14 42 Z" fill="none" stroke={STROKE} strokeWidth={W} />
      <path d="M30 16 Q40 16 30 28" fill="none" stroke={STROKE} strokeWidth={W - 1} />
    </svg>
  );
}

function Book() {
  return (
    <svg viewBox="0 0 60 44" className="h-8 w-11">
      <path d="M30 8 Q15 2 4 8 V38 Q15 32 30 38 Z" fill="none" stroke={STROKE} strokeWidth={W - 1} />
      <path d="M30 8 Q45 2 56 8 V38 Q45 32 30 38 Z" fill="none" stroke={STROKE} strokeWidth={W - 1} />
    </svg>
  );
}

function Tree() {
  return (
    <svg viewBox="0 0 60 90" className="h-20 w-14">
      <line x1="30" y1="55" x2="30" y2="85" stroke={STROKE} strokeWidth={W} />
      <circle cx="30" cy="30" r="26" fill="none" stroke={STROKE} strokeWidth={W} />
    </svg>
  );
}

function Sun() {
  return (
    <svg viewBox="0 0 60 60" className="h-10 w-10">
      <circle cx="30" cy="30" r="14" fill="none" stroke={STROKE} strokeWidth={W} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1={30 + 18 * Math.cos((deg * Math.PI) / 180)}
          y1={30 + 18 * Math.sin((deg * Math.PI) / 180)}
          x2={30 + 26 * Math.cos((deg * Math.PI) / 180)}
          y2={30 + 26 * Math.sin((deg * Math.PI) / 180)}
          stroke={STROKE}
          strokeWidth={W - 1}
        />
      ))}
    </svg>
  );
}

function Cloud() {
  return (
    <svg viewBox="0 0 80 40" className="h-8 w-16">
      <circle cx="24" cy="24" r="14" fill="none" stroke={STROKE} strokeWidth={W - 1} />
      <circle cx="42" cy="18" r="16" fill="none" stroke={STROKE} strokeWidth={W - 1} />
      <circle cx="58" cy="26" r="12" fill="none" stroke={STROKE} strokeWidth={W - 1} />
    </svg>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 60 60" className="h-9 w-9">
      <path
        d="M30 6 L37 24 L56 24 L41 35 L47 54 L30 42 L13 54 L19 35 L4 24 L23 24 Z"
        fill="none"
        stroke={STROKE}
        strokeWidth={W - 1}
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 80 30" className="h-6 w-16">
      <line x1="4" y1="15" x2="70" y2="15" stroke={STROKE} strokeWidth={W} />
      <path d="M58 6 L74 15 L58 24" fill="none" stroke={STROKE} strokeWidth={W} />
    </svg>
  );
}

function Building() {
  return (
    <svg viewBox="0 0 60 90" className="h-20 w-14">
      <rect x="8" y="8" width="44" height="78" fill="none" stroke={STROKE} strokeWidth={W} />
      {[0, 1, 2].map((row) =>
        [0, 1].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={16 + col * 20}
            y={18 + row * 20}
            width="10"
            height="10"
            fill="none"
            stroke={STROKE}
            strokeWidth={1.5}
          />
        ))
      )}
    </svg>
  );
}

function Screen() {
  return (
    <svg viewBox="0 0 70 56" className="h-9 w-11">
      <rect x="6" y="6" width="58" height="38" fill="none" stroke={STROKE} strokeWidth={W} />
      <line x1="35" y1="44" x2="35" y2="52" stroke={STROKE} strokeWidth={W} />
      <line x1="22" y1="52" x2="48" y2="52" stroke={STROKE} strokeWidth={W} />
    </svg>
  );
}

function Folder() {
  return (
    <svg viewBox="0 0 64 48" className="h-8 w-11">
      <path d="M4 12 V42 H60 V16 H30 L24 8 H4 Z" fill="none" stroke={STROKE} strokeWidth={W} />
    </svg>
  );
}

function Box() {
  return (
    <svg viewBox="0 0 60 60" className="h-9 w-9">
      <rect x="8" y="8" width="44" height="44" fill="none" stroke={STROKE} strokeWidth={W} />
      <line x1="8" y1="8" x2="52" y2="52" stroke={STROKE} strokeWidth={W - 1} />
    </svg>
  );
}

const SCENERY: Partial<Record<PropName, { Icon: () => JSX.Element; className: string }>> = {
  sun: { Icon: Sun, className: "absolute right-6 top-6" },
  cloud: { Icon: Cloud, className: "absolute left-6 top-8" },
  tree: { Icon: Tree, className: "absolute bottom-20 left-6" },
  building: { Icon: Building, className: "absolute bottom-20 right-6" },
  goal: { Icon: Goal, className: "absolute bottom-24 right-10" },
};

const NEARBY: Partial<Record<PropName, () => JSX.Element>> = {
  ball: Ball,
  table: Table,
  cup: Cup,
  book: Book,
  star: Star,
  arrow: Arrow,
  screen: Screen,
  folder: Folder,
  box: Box,
};

export function SceneProps({ props }: { props: PropName[] }) {
  const scenery = props.filter((p) => p in SCENERY);
  const nearby = props.filter((p) => p in NEARBY);
  const hasSecondFigure = props.includes("second-figure");

  return (
    <>
      {scenery.map((p) => {
        const entry = SCENERY[p];
        if (!entry) return null;
        const { Icon, className } = entry;
        return (
          <div key={p} className={className} style={{ opacity: 0.5 }}>
            <Icon />
          </div>
        );
      })}

      {nearby.length > 0 && (
        <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 gap-3 opacity-80">
          {nearby.map((p) => {
            const Icon = NEARBY[p];
            if (!Icon) return null;
            return <Icon key={p} />;
          })}
        </div>
      )}

      {hasSecondFigure && (
        <div className="absolute bottom-10 left-[20%] scale-75 opacity-70">
          <StickFigure pose="stand" />
        </div>
      )}
    </>
  );
}
