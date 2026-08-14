/** Public credit packs (prices shown on /pricing). Product IDs come from env at checkout. */

/**
 * Live checkout kill-switch. Keep in sync with `functions/_lib/billing.ts`.
 * Creem merchant approved 2026-08-13 — payments open.
 */
export const PAYMENTS_ENABLED = true;
export const TRIAL_PACK_ENABLED = process.env.NEXT_PUBLIC_TRIAL_PACK_ENABLED === "true";

export type CreditPackId = "trial" | "starter" | "plus" | "pro";

export type CreditPack = {
  id: CreditPackId;
  name: string;
  credits: number;
  priceLabel: string;
  blurb: string;
  popular?: boolean;
};

const BASE_CREDIT_PACKS: CreditPack[] = [
  {
    id: "trial",
    name: "Try",
    credits: 2,
    priceLabel: "$1.99",
    blurb: "Restore this frame first, then decide.",
  },
  {
    id: "starter",
    name: "Starter",
    credits: 5,
    priceLabel: "$3.99",
    blurb: "Try AI restore on a few hard stills.",
  },
  {
    id: "plus",
    name: "Plus",
    credits: 20,
    priceLabel: "$9.99",
    blurb: "Best for a short batch of screenshots.",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    credits: 60,
    priceLabel: "$24.99",
    blurb: "More credits when you process often.",
  },
];

export const CREDIT_PACKS: CreditPack[] = TRIAL_PACK_ENABLED
  ? BASE_CREDIT_PACKS
  : BASE_CREDIT_PACKS.filter((pack) => pack.id !== "trial");

/** 1 credit = 1 AI image enhance (max edge length enforced server-side). */
export const AI_IMAGE_CREDIT_COST = 1;

export function packById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}
