import { priceSource, usdPerTonne, type PriceSeriesId } from "./reference-prices";
import { sha256 } from "./sha256";

export type ProtocolState =
  | "listed"
  | "matched"
  | "countered"
  | "terms_recorded"
  | "inspection_hold"
  | "inspection_passed"
  | "settled"
  | "cancelled";

/**
 * Every legal move, written out independently of the fixtures. Settlement is
 * only reachable through recorded terms and a passed inspection, and the two
 * terminal states accept nothing.
 */
export const transitions: Readonly<Record<ProtocolState, readonly ProtocolState[]>> = {
  listed: ["matched", "cancelled"],
  matched: ["countered", "terms_recorded", "cancelled"],
  countered: ["countered", "terms_recorded", "cancelled"],
  terms_recorded: ["inspection_passed", "inspection_hold", "cancelled"],
  inspection_hold: ["inspection_passed", "cancelled"],
  inspection_passed: ["settled"],
  settled: [],
  cancelled: [],
};

export type ScenarioTone = "signal" | "caution" | "stop";

/** One side of the exchange. Quantities are metric tonnes. */
export interface CommodityLeg {
  commodity: string;
  grade: string;
  priceSeries: PriceSeriesId;
  quantity: number;
}

export type LegSide = "offered" | "requested";

/** A counter-offer that changes the quantity of one leg from that step onward. */
export interface LegAmendment {
  leg: LegSide;
  quantity: number;
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
  amend?: LegAmendment;
}

export interface ProtocolScenario {
  id: string;
  folio: string;
  title: string;
  shortTitle: string;
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
  offered: CommodityLeg;
  requested: CommodityLeg;
  referenceDeltaUsd: number;
  /** SHA-256 head of the hash chain over the genesis entry and every applied event. */
  journalHash: string;
}

export class ProtocolRuleError extends Error {
  override name = "ProtocolRuleError";
}

// Parties, timestamps, evidence references and inspection readings are synthetic.
// Leg prices come from the World Bank Pink Sheet extract in pink-sheet.json.
const scenarios: readonly ProtocolScenario[] = [
  {
    id: "copper-coffee",
    folio: "PL-0174-A",
    title: "Copper cathodes / Arabica coffee",
    shortTitle: "Direct exchange",
    synopsis: "Two lots that balance within 0.1% at the reference prices clear after both pass inspection.",
    tone: "signal",
    offered: {
      commodity: "Copper cathodes",
      grade: "LME grade A, 99.9935% Cu minimum",
      priceSeries: "copper",
      quantity: 18,
    },
    requested: {
      commodity: "Arabica coffee",
      grade: "Other mild Arabicas, ex-dock",
      priceSeries: "coffee-arabica",
      quantity: 35.9,
    },
    initialState: "listed",
    events: [
      {
        id: "copper-coffee-01",
        sequence: 1,
        at: "09:10 UTC",
        actor: "Matching desk",
        action: "Lots matched",
        detail: "At the reference prices the two lots differ by less than 0.1% of their value.",
        from: "listed",
        to: "matched",
        evidence: "VAL-0174",
      },
      {
        id: "copper-coffee-02",
        sequence: 2,
        at: "09:18 UTC",
        actor: "Both parties",
        action: "Terms recorded",
        detail: "Quantity, delivery window, inspection rule and cancellation terms go into the journal.",
        from: "matched",
        to: "terms_recorded",
        evidence: "TERM-0174",
      },
      {
        id: "copper-coffee-03",
        sequence: 3,
        at: "11:42 UTC",
        actor: "Inspection desk",
        action: "Inspection passed",
        detail: "Assay and cupping certificates for both lots meet the recorded terms.",
        from: "terms_recorded",
        to: "inspection_passed",
        evidence: "QA-0174",
      },
      {
        id: "copper-coffee-04",
        sequence: 4,
        at: "12:00 UTC",
        actor: "Clearing desk",
        action: "Exchange settled",
        detail: "The state machine closes both legs. No money, title or goods move.",
        from: "inspection_passed",
        to: "settled",
        evidence: "CLOSE-0174",
      },
    ],
    outcome: "Both lots passed inspection and the exchange settled.",
  },
  {
    id: "wheat-urea",
    folio: "PL-0288-B",
    title: "Hard red winter wheat / urea",
    shortTitle: "Counter-offer",
    synopsis: "The wheat lot is worth 2.2% more than the urea, so the urea seller counters with a smaller wheat quantity.",
    tone: "caution",
    offered: {
      commodity: "Hard red winter wheat",
      grade: "US No. 2 HRW, Gulf export",
      priceSeries: "wheat-us-hrw",
      quantity: 1_200,
    },
    requested: {
      commodity: "Urea",
      grade: "Prilled, f.o.b. Middle East",
      priceSeries: "urea",
      quantity: 1_000,
    },
    initialState: "listed",
    events: [
      {
        id: "wheat-urea-01",
        sequence: 1,
        at: "07:30 UTC",
        actor: "Matching desk",
        action: "Lots matched",
        detail: "Shipment windows line up, but the wheat lot is worth $8,900 more than the urea.",
        from: "listed",
        to: "matched",
        evidence: "VAL-0288",
      },
      {
        id: "wheat-urea-02",
        sequence: 2,
        at: "07:41 UTC",
        actor: "Urea seller",
        action: "Quantity countered",
        detail: "The wheat leg drops to 1,174.4 t, the quantity that matches 1,000 t of urea at the reference prices.",
        from: "matched",
        to: "countered",
        evidence: "COUNTER-0288",
        amend: { leg: "offered", quantity: 1_174.4 },
      },
      {
        id: "wheat-urea-03",
        sequence: 3,
        at: "07:55 UTC",
        actor: "Both parties",
        action: "Revised terms recorded",
        detail: "The countered quantity and the loading window are accepted into the journal.",
        from: "countered",
        to: "terms_recorded",
        evidence: "TERM-0288-R1",
      },
      {
        id: "wheat-urea-04",
        sequence: 4,
        at: "10:20 UTC",
        actor: "Inspection desk",
        action: "Inspection passed",
        detail: "Grade certificates for the wheat and a nitrogen assay for the urea meet the recorded terms.",
        from: "terms_recorded",
        to: "inspection_passed",
        evidence: "QA-0288",
      },
      {
        id: "wheat-urea-05",
        sequence: 5,
        at: "10:35 UTC",
        actor: "Clearing desk",
        action: "Exchange settled",
        detail: "The state machine closes both legs at the countered quantity. No money, title or goods move.",
        from: "inspection_passed",
        to: "settled",
        evidence: "CLOSE-0288",
      },
    ],
    outcome: "The countered quantity passed inspection and the exchange settled.",
  },
  {
    id: "cocoa-rice",
    folio: "PL-0312-C",
    title: "Cocoa beans / Thai white rice",
    shortTitle: "Quality hold",
    synopsis: "A failed moisture reading puts the cocoa on hold, and the exchange is cancelled instead of settled.",
    tone: "stop",
    offered: {
      commodity: "Cocoa beans",
      grade: "ICCO daily price, New York and London",
      priceSeries: "cocoa",
      quantity: 40,
    },
    requested: {
      commodity: "Thai white rice",
      grade: "5% broken, milled, f.o.b. Bangkok",
      priceSeries: "rice-thai-5",
      quantity: 491.3,
    },
    initialState: "listed",
    events: [
      {
        id: "cocoa-rice-01",
        sequence: 1,
        at: "14:02 UTC",
        actor: "Matching desk",
        action: "Lots matched",
        detail: "At the reference prices the two lots differ by less than 0.1% of their value.",
        from: "listed",
        to: "matched",
        evidence: "VAL-0312",
      },
      {
        id: "cocoa-rice-02",
        sequence: 2,
        at: "14:20 UTC",
        actor: "Both parties",
        action: "Terms recorded",
        detail: "The terms cap cocoa bean moisture at 7.5% and cancel the exchange if a retest also fails.",
        from: "matched",
        to: "terms_recorded",
        evidence: "TERM-0312",
      },
      {
        id: "cocoa-rice-03",
        sequence: 3,
        at: "15:16 UTC",
        actor: "Inspection desk",
        action: "Moisture over limit",
        detail: "The cocoa reads 8.1% moisture. The exchange cannot move to settlement from a hold.",
        from: "terms_recorded",
        to: "inspection_hold",
        evidence: "QA-0312",
      },
      {
        id: "cocoa-rice-04",
        sequence: 4,
        at: "17:40 UTC",
        actor: "Inspection desk",
        action: "Exchange cancelled",
        detail: "The retest reads 8.0%, so the recorded terms cancel the exchange. Neither leg moves.",
        from: "inspection_hold",
        to: "cancelled",
        evidence: "CANCEL-0312",
      },
    ],
    outcome: "The cocoa failed its moisture retest and the exchange was cancelled.",
  },
];

export const protocolScenarios = scenarios;

export function getScenario(scenarioId: string): ProtocolScenario {
  return scenarios.find((scenario) => scenario.id === scenarioId) ?? scenarios[0];
}

export function referenceValue(leg: CommodityLeg): number {
  return Math.round(leg.quantity * usdPerTonne(leg.priceSeries) * 100) / 100;
}

/** The first entry of a scenario's hash chain: folio, start state, both legs and the price period. */
export function genesisEntry(scenario: ProtocolScenario): string {
  const { offered, requested } = scenario;

  return [
    scenario.folio,
    scenario.initialState,
    `offered=${offered.priceSeries}:${offered.quantity}`,
    `requested=${requested.priceSeries}:${requested.quantity}`,
    `prices=pink-sheet:${priceSource.period}`,
  ].join("|");
}

export function eventEntry(event: ProtocolEvent): string {
  const amendment = event.amend ? `|${event.amend.leg}=${event.amend.quantity}` : "";
  return `${event.sequence}|${event.id}|${event.from}>${event.to}${amendment}`;
}

/** Each head is SHA-256 of the previous head, a newline, and the next entry. */
export function chainHash(previousHead: string, entry: string): string {
  return sha256(`${previousHead}\n${entry}`);
}

export function canTransition(from: ProtocolState, to: ProtocolState): boolean {
  return transitions[from].includes(to);
}

function applyEvent(
  scenarioId: string,
  index: number,
  state: ProtocolState,
  legs: Record<LegSide, CommodityLeg>,
  event: ProtocolEvent,
): ProtocolState {
  const where = `${scenarioId} event ${index + 1}`;

  if (event.sequence !== index + 1) {
    throw new ProtocolRuleError(`${where}: sequence ${event.sequence} is out of order`);
  }
  if (event.from !== state) {
    throw new ProtocolRuleError(`${where}: starts from ${event.from}, but the exchange is ${state}`);
  }
  if (!canTransition(state, event.to)) {
    throw new ProtocolRuleError(`${where}: illegal transition ${state} > ${event.to}`);
  }

  if (event.amend) {
    const { leg, quantity } = event.amend;

    if (event.to !== "countered") {
      throw new ProtocolRuleError(`${where}: only a counter-offer can amend a leg`);
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new ProtocolRuleError(`${where}: invalid amended quantity ${quantity}`);
    }

    legs[leg] = { ...legs[leg], quantity };
  }

  return event.to;
}

/**
 * Replays a scenario to the requested step. The whole journal is validated on
 * every call, so a fixture with an illegal move fails at load, not when reached.
 */
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
  const legs: Record<LegSide, CommodityLeg> = {
    offered: scenario.offered,
    requested: scenario.requested,
  };
  let state = scenario.initialState;
  let head = sha256(genesisEntry(scenario));
  let snapshotLegs = { ...legs };
  let snapshotState = state;
  let snapshotHead = head;

  scenario.events.forEach((event, index) => {
    state = applyEvent(scenario.id, index, state, legs, event);
    head = chainHash(head, eventEntry(event));

    if (index + 1 === appliedSteps) {
      snapshotLegs = { ...legs };
      snapshotState = state;
      snapshotHead = head;
    }
  });

  return {
    scenarioId: scenario.id,
    appliedSteps,
    state: snapshotState,
    journal: scenario.events.slice(0, appliedSteps),
    nextEvent: scenario.events[appliedSteps] ?? null,
    progress: Math.round((appliedSteps / scenario.events.length) * 100),
    isComplete: appliedSteps === scenario.events.length,
    offered: snapshotLegs.offered,
    requested: snapshotLegs.requested,
    referenceDeltaUsd:
      Math.round((referenceValue(snapshotLegs.offered) - referenceValue(snapshotLegs.requested)) * 100) /
      100,
    journalHash: snapshotHead,
  };
}

export function protocolStateLabel(state: ProtocolState): string {
  return state.replaceAll("_", " ");
}
