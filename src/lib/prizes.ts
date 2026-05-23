export type Prize = "ice_cream" | "soda" | "bowl" | "discount_50";

export interface PrizeMeta {
  key: Prize;
  label: string;
  short: string;
  emoji: string;
  color: string; // hsl/oklch for wheel slice
  description: string;
}

export const PRIZES: PrizeMeta[] = [
  {
    key: "ice_cream",
    label: "Gratis ijsje",
    short: "IJSJE",
    emoji: "🍦",
    color: "oklch(0.85 0.13 80)",
    description: "Eén gratis ijsje bij je volgende bestelling.",
  },
  {
    key: "soda",
    label: "Gratis soda",
    short: "SODA",
    emoji: "🥤",
    color: "oklch(0.7 0.15 200)",
    description: "Eén gratis soda bij je volgende bestelling.",
  },
  {
    key: "bowl",
    label: "Gratis bowl",
    short: "BOWL",
    emoji: "🥗",
    color: "oklch(0.72 0.17 145)",
    description: "Eén gratis poke bowl naar keuze.",
  },
  {
    key: "discount_50",
    label: "50% korting",
    short: "-50%",
    emoji: "🎉",
    color: "oklch(0.65 0.22 28)",
    description: "50% korting op je volgende bestelling.",
  },
];

export const prizeMeta = (k: Prize) => PRIZES.find((p) => p.key === k)!;
