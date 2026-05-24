"use client";

import { useState } from "react";

type Option = {
  value: number;
  label: string;
  description?: string;
};

const TONE_CLASSES = {
  1: {
    base: "text-rose-700",
    active: "bg-rose-100 text-rose-800 ring-2 ring-rose-300 ring-offset-1 ring-offset-white",
  },
  2: {
    base: "text-amber-700",
    active: "bg-amber-100 text-amber-800 ring-2 ring-amber-300 ring-offset-1 ring-offset-white",
  },
  3: {
    base: "text-emerald-700",
    active: "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300 ring-offset-1 ring-offset-white",
  },
} as const;

export function ScoreSegment({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: number;
  options: Option[];
}) {
  const [value, setValue] = useState<number>(defaultValue || 2);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1"
      >
        {options.map((o) => {
          const isActive = value === o.value;
          const tone = TONE_CLASSES[o.value as 1 | 2 | 3];
          return (
            <label
              key={o.value}
              className={`flex cursor-pointer select-none flex-col items-center justify-center rounded-lg px-2 py-2.5 text-center transition-all ${
                isActive
                  ? tone.active
                  : `bg-white/0 ${tone.base} hover:bg-white hover:text-zinc-900`
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={isActive}
                onChange={() => setValue(o.value)}
                className="sr-only"
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                {o.value}
              </span>
              <span className="text-sm font-semibold leading-tight">{o.label}</span>
              {o.description ? (
                <span className="text-[10px] opacity-60">{o.description}</span>
              ) : null}
            </label>
          );
        })}
      </div>
    </div>
  );
}
