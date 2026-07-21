export type ProtocolState =
  | "listed"
  | "matched"
  | "countered"
  | "terms_recorded"
  | "inspection_hold"
  | "inspection_passed"
  | "settled"
  | "cancelled";

export type ScenarioTone = "signal" | "caution" | "stop";

export interface CommodityLeg {
  commodity: string;
  grade: string;
  origin: string;
  quantity: number;
  unit: string;
  referenceValueUsd: number;
}

export interface ProtocolEvent {
  id: string;
  sequence: number;
  at: string;
  actor: string;
  action: string;
  detail: string;
  from: ProtocolState;
  to: ProtocolState;
  evidence: string;
}

export interface ProtocolScenario {
  id: string;
  folio: string;
  title: string;
  shortTitle: string;
  route: string;
  synopsis: string;
  tone: ScenarioTone;
  offered: CommodityLeg;
  requested: CommodityLeg;
  initialState: ProtocolState;
  events: readonly ProtocolEvent[];
  outcome: string;
}

export interface ReplaySnapshot {
  scenarioId: string;
  appliedSteps: number;
  state: ProtocolState;
  journal: readonly ProtocolEvent[];
  nextEvent: ProtocolEvent | null;
  progress: number;
  isComplete: boolean;
  referenceDeltaUsd: number;
  fingerprint: string;
}

const scenarios: readonly ProtocolScenario[] = [
  {
    id: "copper-coffee",
    folio: "PL-0174-A",
    title: "Copper cathodes / green coffee",
    shortTitle: "Direct exchange",
    route: "Antofagasta → Cartagena",
    synopsis:
      "A balanced two-party exchange clears after both lots pass documentary inspection.",
    tone: "signal",
    offered: {
      commodity: "Copper cathodes",
      grade: "LME Grade A · 99.99%",
      origin: "Antofagasta, CL",
      quantity: 18,
      unit: "metric t",
      referenceValueUsd: 8_420,
    },
    requested: {
      commodity: "Green coffee",
      grade: "Excelso EP · 15+",
      origin: "Huila, CO",
      quantity: 57.6,
      unit: "metric t",
      referenceValueUsd: 2_630,
    },
    initialState: "listed",
    events: [
      {
        id: "copper-coffee-01",
        sequence: 1,
        at: "09:10 UTC",
        actor: "Matching desk",
        action: "Reference values aligned",
        detail: "The synthetic lots differ by less than one tenth of one percent at the fixed reference sheet.",
        from: "listed",
        to: "matched",
        evidence: "VAL-0174 / fixed demo rates",
      },
      {
        id: "copper-coffee-02",
        sequence: 2,
        at: "09:18 UTC",
        actor: "Both counterparties",
        action: "Paper terms recorded",
        detail: "Quantity, delivery window, inspection rule, and cancellation boundary are written to the local journal.",
        from: "matched",
        to: "terms_recorded",
        evidence: "TERM-0174 / synthetic manifest",
      },
      {
        id: "copper-coffee-03",
        sequence: 3,
        at: "11:42 UTC",
        actor: "Inspection desk",
        action: "Documents passed",
        detail: "The demo advances after both fixture certificates satisfy the scenario rule set.",
        from: "terms_recorded",
        to: "inspection_passed",
        evidence: "QA-0174 / fixture only",
      },
      {
        id: "copper-coffee-04",
        sequence: 4,
        at: "12:00 UTC",
        actor: "Clearing desk",
        action: "Exchange marked settled",
        detail: "The local state machine closes both legs. No money, title, token, or commodity moves.",
        from: "inspection_passed",
        to: "settled",
        evidence: "CLOSE-0174 / simulated",
      },
    ],
    outcome: "Balanced exchange · simulated close",
  },
  {
    id: "wheat-freight",
    folio: "PL-0288-B",
    title: "Durum wheat / freight capacity",
    shortTitle: "Counter-offer",
    route: "Bari → Alexandria",
    synopsis:
      "A freight-capacity mismatch is corrected through one deterministic counter-offer.",
    tone: "caution",
    offered: {
      commodity: "Durum wheat",
      grade: "EU No. 1 · 13% protein",
      origin: "Puglia, IT",
      quantity: 420,
      unit: "metric t",
      referenceValueUsd: 382,
    },
    requested: {
      commodity: "Break-bulk freight",
      grade: "Covered hold · 500 t",
      origin: "Adriatic service",
      quantity: 1,
      unit: "voyage",
      referenceValueUsd: 148_000,
    },
    initialState: "listed",
    events: [
      {
        id: "wheat-freight-01",
        sequence: 1,
        at: "07:30 UTC",
        actor: "Matching desk",
        action: "Candidate route found",
        detail: "The fixture matches commodity, port window, and capacity constraints but not reference value.",
        from: "listed",
        to: "matched",
        evidence: "ROUTE-0288 / fixture timetable",
      },
      {
        id: "wheat-freight-02",
        sequence: 2,
        at: "07:41 UTC",
        actor: "Freight counterparty",
        action: "Quantity countered",
        detail: "The wheat leg is reduced to 387.4 metric tonnes against the same fixed voyage fixture.",
        from: "matched",
        to: "countered",
        evidence: "COUNTER-0288 / deterministic rule",
      },
      {
        id: "wheat-freight-03",
        sequence: 3,
        at: "07:55 UTC",
        actor: "Both counterparties",
        action: "Revised terms recorded",
        detail: "The countered quantity and laycan window are accepted in the local protocol journal.",
        from: "countered",
        to: "terms_recorded",
        evidence: "TERM-0288-R1 / synthetic",
      },
      {
        id: "wheat-freight-04",
        sequence: 4,
        at: "08:15 UTC",
        actor: "Clearing desk",
        action: "Exchange marked settled",
        detail: "The demonstration closes with a paper-ledger receipt and no external settlement call.",
        from: "terms_recorded",
        to: "settled",
        evidence: "CLOSE-0288 / simulated",
      },
    ],
    outcome: "Counter-offer accepted · simulated close",
  },
  {
    id: "cocoa-hold",
    folio: "PL-0312-C",
    title: "Cocoa beans / machine bearings",
    shortTitle: "Quality hold",
    route: "Guayaquil → Genoa",
    synopsis:
      "A quality variance triggers a hold and a clean cancellation rather than a fabricated settlement.",
    tone: "stop",
    offered: {
      commodity: "Cocoa beans",
      grade: "Arriba Nacional · Grade 1",
      origin: "Los Ríos, EC",
      quantity: 24,
      unit: "metric t",
      referenceValueUsd: 7_180,
    },
    requested: {
      commodity: "Machine bearings",
      grade: "6205-2RS · sealed",
      origin: "Torino, IT",
      quantity: 3_600,
      unit: "units",
      referenceValueUsd: 47.5,
    },
    initialState: "listed",
    events: [
      {
        id: "cocoa-hold-01",
        sequence: 1,
        at: "14:02 UTC",
        actor: "Matching desk",
        action: "Candidate lots paired",
        detail: "Reference values and delivery windows fit the scenario tolerance.",
        from: "listed",
        to: "matched",
        evidence: "VAL-0312 / fixed demo rates",
      },
      {
        id: "cocoa-hold-02",
        sequence: 2,
        at: "15:16 UTC",
        actor: "Inspection desk",
        action: "Moisture variance flagged",
        detail: "A fixture reading exceeds the agreed threshold and automatically blocks further progression.",
        from: "matched",
        to: "inspection_hold",
        evidence: "QA-0312 / synthetic variance",
      },
      {
        id: "cocoa-hold-03",
        sequence: 3,
        at: "15:22 UTC",
        actor: "Protocol rule",
        action: "Exchange cancelled",
        detail: "The deterministic cancellation boundary is applied; neither leg is represented as transferred.",
        from: "inspection_hold",
        to: "cancelled",
        evidence: "CANCEL-0312 / rule Q-04",
      },
    ],
    outcome: "Inspection boundary applied · no settlement",
  },
] as const;

export const protocolScenarios = scenarios;

export function getScenario(scenarioId: string): ProtocolScenario {
  return scenarios.find((scenario) => scenario.id === scenarioId) ?? scenarios[0];
}

function referenceValue(leg: CommodityLeg): number {
  return Math.round(leg.quantity * leg.referenceValueUsd * 100) / 100;
}

function fingerprint(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

export function replayScenario(
  scenarioOrId: ProtocolScenario | string,
  requestedSteps: number,
): ReplaySnapshot {
  const scenario =
    typeof scenarioOrId === "string" ? getScenario(scenarioOrId) : scenarioOrId;
  const appliedSteps = Math.max(
    0,
    Math.min(Math.trunc(requestedSteps), scenario.events.length),
  );
  const journal = scenario.events.slice(0, appliedSteps);
  let state = scenario.initialState;

  for (const event of journal) {
    if (event.from !== state) {
      throw new Error(
        `Invalid protocol transition in ${scenario.id}: expected ${state}, received ${event.from}`,
      );
    }

    state = event.to;
  }

  const fingerprintSource = [
    scenario.folio,
    state,
    ...journal.map((event) => `${event.id}:${event.from}>${event.to}`),
  ].join("|");

  return {
    scenarioId: scenario.id,
    appliedSteps,
    state,
    journal,
    nextEvent: scenario.events[appliedSteps] ?? null,
    progress: Math.round((appliedSteps / scenario.events.length) * 100),
    isComplete: appliedSteps === scenario.events.length,
    referenceDeltaUsd:
      Math.round((referenceValue(scenario.offered) - referenceValue(scenario.requested)) * 100) /
      100,
    fingerprint: fingerprint(fingerprintSource),
  };
}

export function protocolStateLabel(state: ProtocolState): string {
  return state.replaceAll("_", " ");
}
