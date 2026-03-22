import { LEVEL_CANDIDATES, DEFAULT_CC } from "./color-engine";

export type ColorAction =
  | { type: "set_color"; lv: number; idx: number }
  | { type: "cycle_color"; lv: number; dir: number };

export function colorReducer(state: number[], action: ColorAction): number[] {
  switch (action.type) {
    case "set_color": {
      if (action.lv < 0 || action.lv >= LEVEL_CANDIDATES.length) return state;
      const alts = LEVEL_CANDIDATES[action.lv];
      if (action.idx < 0 || action.idx >= alts.length) return state;
      const n = [...state]; n[action.lv] = action.idx; return n;
    }
    case "cycle_color": {
      if (action.lv < 0 || action.lv >= LEVEL_CANDIDATES.length) return state;
      const a = LEVEL_CANDIDATES[action.lv]; if (a.length <= 1) return state;
      const n = [...state];
      n[action.lv] = ((n[action.lv] + action.dir) % a.length + a.length) % a.length;
      return n;
    }
    default: return state;
  }
}
