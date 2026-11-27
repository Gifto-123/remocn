/**
 * One-hand scheduler. Every pen action (image reveal, text, annotation) is a slot.
 * `at` = frame the pen should TOUCH paper (narration word start). Hand slide-in is
 * placed before it. Slots are packed so two hands can never be on screen together.
 * Spread the result into DrawOn / MarkerText / Hand* components.
 */
export type HandSlot = {
  /** Frame (beat-local) the pen should start drawing. */
  at: number;
  /** Frames the pen spends drawing. */
  draw: number;
  /** Hand slide-in / slide-out frames. Default 4 / 4. */
  enter?: number;
  exit?: number;
  /** false = reveal without a hand (does not occupy the hand). */
  hand?: boolean;
};

export type PlannedSlot = {
  delay: number;
  duration: number;
  handEnter: number;
  handExit: number;
  showHand: boolean;
};

export type PlanOptions = {
  /** Label for warnings, e.g. "scene1/A". */
  label?: string;
  /** Beat length in frames; warns if the last hand exit runs past it. */
  limit?: number;
  /** Warn when a slot is pushed later than `at` by more than this. Default 12. */
  maxSlip?: number;
};

export const planHand = <K extends string>(
  slots: Record<K, HandSlot>,
  {label = "hand", limit, maxSlip = 12}: PlanOptions = {},
): Record<K, PlannedSlot> => {
  const entries = (Object.entries(slots) as [K, HandSlot][])
    .map(([key, s], i) => ({key, s, i}))
    .sort((a, b) => a.s.at - b.s.at || a.i - b.i);

  const out = {} as Record<K, PlannedSlot>;
  let free = 0; // first frame the hand is available again

  for (const {key, s} of entries) {
    const enter = s.enter ?? 4;
    const exit = s.exit ?? 4;
    const showHand = s.hand !== false;
    const wanted = Math.max(0, s.at - enter);
    const delay = showHand ? Math.max(wanted, free) : wanted;
    if (showHand) {
      free = delay + enter + s.draw + exit + 1;
      const slip = delay - wanted;
      if (slip > maxSlip) {
        console.warn(`[handPlan:${label}] "${key}" slips ${slip}f (at ${s.at}). Shorten earlier draws or move it.`);
      }
    }
    out[key] = {delay, duration: s.draw, handEnter: enter, handExit: exit, showHand};
  }

  if (limit !== undefined && free > limit) {
    console.warn(`[handPlan:${label}] hand busy until ${free}f > beat length ${limit}f.`);
  }
  return out;
};