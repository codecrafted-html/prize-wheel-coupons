import { useEffect, useMemo, useRef, useState } from "react";
import { PRIZES, type Prize } from "@/lib/prizes";

interface Props {
  targetPrize: Prize;
  spinning: boolean;
  onDone: () => void;
}

/**
 * 8-segment wheel: every prize appears twice (opposite sides) so the
 * landing animation always feels fair regardless of the assigned prize.
 */
const SEGMENTS: Prize[] = [
  "ice_cream", "soda", "bowl", "discount_50",
  "ice_cream", "soda", "bowl", "discount_50",
];

const SEGMENT_DEG = 360 / SEGMENTS.length;

export function SpinWheel({ targetPrize, spinning, onDone }: Props) {
  const [rotation, setRotation] = useState(0);
  const startedRef = useRef(false);

  const meta = useMemo(
    () => Object.fromEntries(PRIZES.map((p) => [p.key, p])) as Record<Prize, (typeof PRIZES)[number]>,
    [],
  );

  useEffect(() => {
    if (!spinning || startedRef.current) return;
    startedRef.current = true;

    // pick a random segment matching the target prize
    const indices = SEGMENTS.map((p, i) => (p === targetPrize ? i : -1)).filter((i) => i >= 0);
    const chosen = indices[Math.floor(Math.random() * indices.length)];

    // pointer is at top (0deg). center of segment i is at i*SEGMENT_DEG + SEGMENT_DEG/2
    const targetAngle = chosen * SEGMENT_DEG + SEGMENT_DEG / 2;
    // small random jitter inside segment
    const jitter = (Math.random() - 0.5) * (SEGMENT_DEG * 0.6);
    // rotate counter-clockwise so the segment lands under the pointer
    const finalRotation = 360 * 6 - targetAngle + jitter;

    // next frame to ensure transition kicks in
    requestAnimationFrame(() => setRotation(finalRotation));

    const t = setTimeout(onDone, 4800);
    return () => clearTimeout(t);
  }, [spinning, targetPrize, onDone]);

  // build conic gradient slices
  const conic = SEGMENTS.map((p, i) => {
    const from = i * SEGMENT_DEG;
    const to = (i + 1) * SEGMENT_DEG;
    return `${meta[p].color} ${from}deg ${to}deg`;
  }).join(", ");

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* pointer */}
      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-2">
        <div
          className="h-0 w-0 drop-shadow-lg"
          style={{
            borderLeft: "18px solid transparent",
            borderRight: "18px solid transparent",
            borderTop: "28px solid var(--primary)",
          }}
        />
      </div>

      {/* outer ring */}
      <div className="absolute inset-0 rounded-full bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]" />

      {/* wheel */}
      <div
        className="absolute inset-3 rounded-full"
        style={{
          background: `conic-gradient(${conic})`,
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? "transform 4.8s cubic-bezier(0.16, 1, 0.3, 1)"
            : "none",
          boxShadow: "inset 0 0 0 6px var(--color-card), inset 0 0 0 8px rgba(0,0,0,0.08)",
        }}
      >
        {SEGMENTS.map((p, i) => {
          const angle = i * SEGMENT_DEG + SEGMENT_DEG / 2;
          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 origin-top -translate-x-1/2"
              style={{ transform: `translate(-50%, 0) rotate(${angle}deg)`, height: "50%" }}
            >
              <div className="flex flex-col items-center gap-1 pt-6 text-white drop-shadow">
                <span className="text-3xl">{meta[p].emoji}</span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {meta[p].short}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* center hub */}
      <div className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-4 ring-card">
        <span className="font-display text-sm font-bold">PL</span>
      </div>
    </div>
  );
}
