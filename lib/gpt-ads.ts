/** Google Ad Manager (GPT) slots for matchafilter.online — network 23353417342 */

export type GptAdKey =
  | "home_infeed"
  | "home_leaderboard"
  | "remove_content"
  | "apply_content"
  | "guide_leaderboard";

export type GptSize = "fluid" | [number, number];

export type GptAdConfig = {
  path: string;
  sizes: GptSize[];
  divId: string;
  /** Min box so layout does not jump before fill */
  minWidth?: number;
  minHeight?: number;
};

export const GPT_ADS: Record<GptAdKey, GptAdConfig> = {
  home_infeed: {
    path: "/23353417342/home_infeed_responsive_matchafilter.online",
    sizes: ["fluid"],
    divId: "div-gpt-ad-1787542543828-0",
    minHeight: 100,
  },
  home_leaderboard: {
    path: "/23353417342/home_leaderboard_responsive_matchafilter.online",
    /** PC 728×90 + mobile 320×50 */
    sizes: [
      [728, 90],
      [320, 50],
    ],
    divId: "div-gpt-ad-1787539500646-0",
    minWidth: 320,
    minHeight: 50,
  },
  remove_content: {
    path: "/23353417342/remove_content_responsive_matchafilter.online",
    sizes: [
      [300, 250],
      [728, 90],
    ],
    divId: "div-gpt-ad-1787540144217-0",
    minWidth: 300,
    minHeight: 90,
  },
  apply_content: {
    path: "/23353417342/apply_content_responsive_matchafilter.online",
    sizes: [
      [728, 90],
      [300, 250],
    ],
    divId: "div-gpt-ad-1787540199437-0",
    minWidth: 300,
    minHeight: 90,
  },
  guide_leaderboard: {
    path: "/23353417342/guide_leaderboard_responsive_matchafilter.online",
    /** PC 728×90 + mobile 320×50 */
    sizes: [
      [728, 90],
      [320, 50],
    ],
    divId: "div-gpt-ad-1787539718930-0",
    minWidth: 320,
    minHeight: 50,
  },
};

export const GPT_SCRIPT_SRC = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
