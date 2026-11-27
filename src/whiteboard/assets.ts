/**
 * Metadata for the prepared PNGs in public/assets.
 * `width` / `height` are the real pixel size of each file (used to keep aspect ratio).
 */

export type AssetInfo = {
  /** Path inside public/, for staticFile() */
  file: string;
  width: number;
  height: number;
};

export const HAND_PEN = {
  file: "assets/hand-pen.png",
  width: 439,
  height: 586,
  /** Where the pen tip is inside the PNG, in source pixels. */
  tip: {x: 5, y: 5},
} as const;

export const ASSETS = {
  man: {file: "assets/character-man.png", width: 928, height: 1545},
  moneyColor: {file: "assets/money-stack-color.png", width: 440, height: 314},
  moneySketch: {file: "assets/money-stack-sketch.png", width: 944, height: 1066},
} satisfies Record<string, AssetInfo>;

/**
 * Display size that keeps the asset's aspect ratio.
 * Pass `width` or `height` (not both).
 */
export const fit = (
  asset: AssetInfo,
  size: {width: number} | {height: number},
): {width: number; height: number} => {
  if ("width" in size) {
    return {
      width: size.width,
      height: Math.round((size.width * asset.height) / asset.width),
    };
  }
  return {
    width: Math.round((size.height * asset.width) / asset.height),
    height: size.height,
  };
};
