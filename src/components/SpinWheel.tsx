import { useEffect, useMemo, useRef, useState } from "react";
import { PRIZES, type Prize } from "@/lib/prizes";
import logo from "@/assets/logo.png";

interface Props {
  targetPrize: Prize;
  spinning: boolean;
  onDone: () => void;
}

// 12-segment wheel: prizes interleaved so similar outcomes are spread out.
const SEGMENTS: Prize[] = [
  "ice_cream", "soda", "side_dish", "bowl",
  "ice_cream", "soda", "side_dish", "bowl",
  "ice_cream", "soda", "side_dish", "soda",
];
const SEG = 360 / SEGMENTS.length;
const SPIN_MS = 5000;

export function SpinWheel({ targetPrize, spinning, onDone }: Props) {
  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);
  const startedRef = useRef(false);

  const meta = useMemo(
    () => Object.fromEntries(PRIZES.map((p) => [p.key, p])) as Record<Prize, (typeof PRIZES)[number]>,
    [],
  );

  useEffect(() => {
    if (!spinning || startedRef.current) return;
    startedRef.current = true;

    // Pick a random segment matching the target prize.
    const indices = SEGMENTS.flatMap((p, i) => (p === targetPrize ? [i] : []));
    const chosen = indices[Math.floor(Math.random() * indices.length)];

    // Segment i's center is at i*SEG + SEG/2 (clockwise from top).
    // Rotating the wheel by R moves that center to (i*SEG + SEG/2 + R) mod 360.
    // We want it under the top pointer (0), so R ≡ -(center) (mod 360).
    const center = chosen * SEG + SEG / 2;
    const jitter = (Math.random() - 0.5) * (SEG * 0.6);
    const finalRotation = 360 * 6 + (360 - center) + jitter;

    // Two rAFs to guarantee the browser commits the initial state
    // before the transition target is applied.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimating(true);
        setRotation(finalRotation);
      });
    });

    const t = setTimeout(() => {
      setAnimating(false);
      onDone();
    }, SPIN_MS + 150);
    return () => clearTimeout(t);
  }, [spinning, targetPrize, onDone]);

  const conic = SEGMENTS.map((p, i) => {
    const from = i * SEG;
    const to = (i + 1) * SEG;
    return `${meta[p].color} ${from}deg ${to}deg`;
  }).join(", ");

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* pointer */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-1">
        <div
          className="h-0 w-0"
          style={{
            borderLeft: "16px solid transparent",
            borderRight: "16px solid transparent",
            borderTop: "26px solid var(--primary)",
            filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))",
          }}
        />
      </div>

      {/* outer ring */}
      <div className="absolute inset-0 rounded-full bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] ring-1 ring-black/5" />

      {/* wheel */}
      <div
        className="absolute inset-3 overflow-hidden rounded-full"
        style={{
          background: `conic-gradient(${conic})`,
          transform: `rotate(${rotation}deg)`,
          transition: animating
            ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
            : "none",
          boxShadow:
            "inset 0 0 0 6px var(--color-card), inset 0 0 0 8px rgba(0,0,0,0.08)",
        }}
      >
        {SEGMENTS.map((p, i) => {
          // Position each label at the center angle of its segment.
          // Use a wrapper rotated by `angle`, then push the text outward
          // along the rotated axis with translateY(-radius), and finally
          // rotate the text 180° so it reads from outside-in (legible).
          const angle = i * SEG + SEG / 2;
          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                width: 0,
                height: 0,
              }}
            >
              <div
                className="flex flex-col items-center gap-0.5 text-white"
                style={{
                  transform: "translate(-50%, -135px) rotate(180deg)",
                  width: 70,
                  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
                }}
              >
                <span className="text-2xl leading-none">{meta[p].emoji}</span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  {meta[p].short}
                </span>
              </div>
            </div>
          );
        })}

        {/* segment dividers */}
        {SEGMENTS.map((_, i) => (
          <div
            key={`div-${i}`}
            className="pointer-events-none absolute left-1/2 top-1/2 origin-top"
            style={{
              width: 2,
              height: "50%",
              background: "rgba(255,255,255,0.5)",
              transform: `translate(-50%, 0) rotate(${i * SEG}deg)`,
            }}
          />
        ))}
      </div>

      {/* center hub */}
      {/* center hub with logo */}
      <div className="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-white shadow-xl ring-4 ring-card">
        <img src={logo} alt="Poké-Loco" className="h-full w-full object-contain p-2" />
      </div>
    </div>
  );
}
