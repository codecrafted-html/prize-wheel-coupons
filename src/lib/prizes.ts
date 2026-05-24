export type Prize =
  | "ice_cream"
  | "soda"
  | "bowl"
  | "side_dish"
  | "discount_50"
  | "no_win"
  | "try_again";

export interface PrizeMeta {
  key: Prize;
  label: string;
  short: string;
  emoji: string;
  color: string;
  description: string;
}

export const PRIZES: PrizeMeta[] = [
  {
    key: "ice_cream",
    label: "Gratis ijsje",
    short: "IJSJE",
    emoji: "🍦",
    color: "oklch(0.85 0.13 75)",
    description: "Eén gratis ijsje bij je volgende bestelling.",
  },
  {
    key: "soda",
    label: "Gratis drankje",
    short: "DRANK",
    emoji: "🥤",
    color: "oklch(0.72 0.16 230)",
    description: "Eén gratis drankje bij je volgende bestelling.",
  },
  {
    key: "bowl",
    label: "Gratis bowl",
    short: "BOWL",
    emoji: "🥗",
    color: "oklch(0.74 0.17 145)",
    description: "Eén gratis poke bowl naar keuze.",
  },
  {
    key: "side_dish",
    label: "Gratis bijgerecht",
    short: "BIJGER.",
    emoji: "🍟",
    color: "oklch(0.78 0.15 50)",
    description: "Eén gratis bijgerecht bij je volgende bestelling.",
  },
  {
    key: "discount_50",
    label: "50% korting",
    short: "-50%",
    emoji: "🎉",
    color: "oklch(0.68 0.22 25)",
    description: "50% korting op je volgende bestelling.",
  },
  {
    key: "try_again",
    label: "Probeer opnieuw",
    short: "RETRY",
    emoji: "🔄",
    color: "oklch(0.78 0.10 280)",
    description: "Helaas, geen prijs deze keer. Probeer het later opnieuw!",
  },
  {
    key: "no_win",
    label: "Niets gewonnen",
    short: "HELAAS",
    emoji: "😅",
    color: "oklch(0.65 0.04 250)",
    description: "Helaas, deze keer geen prijs. Beter geluk volgende keer!",
  },
];

export const prizeMeta = (k: Prize) => PRIZES.find((p) => p.key === k)!;
