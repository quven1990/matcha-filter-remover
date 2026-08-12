/** Public credit packs (prices shown on /pricing). Product IDs come from env at checkout. */

/**
 * Temporary kill-switch while Creem Live merchant verification is pending.
 * Flip to `true` (and mirror in functions/_lib/billing.ts) when asked to reopen payments.
 */
export const PAYMENTS_ENABLED = false;

export type CreditPackId = "starter" | "plus" | "pro";

export type CreditPack = {
  id: CreditPackId;
  name: string;
  credits: number;
  priceLabel: string;
  blurb: string;
  popular?: boolean;
};

export const CREDIT_PACKS: CreditPack[] = [
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

/** 1 credit = 1 AI image enhance (max edge length enforced server-side). */
export const AI_IMAGE_CREDIT_COST = 1;

export function packById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}
