import type { ProtocolState } from "./demo-engine";

export type StateTone = "open" | "pass" | "caution" | "stop";

export const stateTone: Record<ProtocolState, StateTone> = {
  listed: "open",
  matched: "open",
  terms_recorded: "open",
  countered: "caution",
  inspection_hold: "caution",
  inspection_passed: "pass",
  settled: "pass",
  cancelled: "stop",
};
