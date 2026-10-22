import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  chainHash,
  eventEntry,
  genesisEntry,
  getScenario,
  protocolScenarios,
  ProtocolRuleError,
  referenceValue,
  replayScenario,
  transitions,
  type ProtocolEvent,
  type ProtocolScenario,
  type ProtocolState,
} from "./demo-engine";
import pinkSheet from "./pink-sheet.json";
import { priceSource, usdPerTonne } from "./reference-prices";
import { sha256 } from "./sha256";

const nodeSha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

function withEvents(scenario: ProtocolScenario, events: ProtocolEvent[]): ProtocolScenario {
  return { ...scenario, events };
}

function event(sequence: number, from: ProtocolState, to: ProtocolState): ProtocolEvent {
  return {
    id: `probe-${sequence}`,
    sequence,
    at: "00:00 UTC",
    actor: "Test",
    action: "Probe",
    detail: "Probe",
    from,
    to,
    evidence: "TEST",
  };
}

function path(...states: ProtocolState[]): ProtocolEvent[] {
  return states.slice(1).map((to, index) => event(index + 1, states[index], to));
}

test("all three fixtures replay to their declared terminal state", () => {
  const terminalStates = protocolScenarios.map(
    (scenario) => replayScenario(scenario, scenario.events.length).state,
  );

  assert.deepEqual(terminalStates, ["settled", "settled", "cancelled"]);
});

test("a replay is deterministic at every step", () => {
  for (const scenario of protocolScenarios) {
    for (let step = 0; step <= scenario.events.length; step += 1) {
      assert.deepEqual(replayScenario(scenario, step), replayScenario(scenario.id, step));
    }
  }
});

test("replay clamps out-of-range steps without mutating fixtures", () => {
  const scenario = protocolScenarios[0];
  const originalEventCount = scenario.events.length;

  assert.equal(replayScenario(scenario, -9).appliedSteps, 0);
  assert.equal(replayScenario(scenario, 999).appliedSteps, originalEventCount);
  assert.equal(scenario.events.length, originalEventCount);
});

test("the transition table has no exits from terminal states and only one way into settlement", () => {
  assert.deepEqual(transitions.settled, []);
  assert.deepEqual(transitions.cancelled, []);

  const intoSettled = Object.entries(transitions)
    .filter(([, targets]) => targets.includes("settled"))
    .map(([from]) => from);
  assert.deepEqual(intoSettled, ["inspection_passed"]);
});

test("every fixture event is a move the table allows", () => {
  for (const scenario of protocolScenarios) {
    for (const { from, to, id } of scenario.events) {
      assert.ok(transitions[from].includes(to), `${id}: ${from} > ${to}`);
    }
  }
});

test("skipping a state is rejected", () => {
  const base = getScenario("copper-coffee");
  const skips: ProtocolState[][] = [
    ["listed", "settled"],
    ["listed", "terms_recorded"],
    ["listed", "matched", "inspection_passed"],
    ["listed", "matched", "terms_recorded", "settled"],
    ["listed", "matched", "countered", "settled"],
  ];

  for (const states of skips) {
    const scenario = withEvents(base, path(...states));
    assert.throws(
      () => replayScenario(scenario, 0),
      (error: unknown) =>
        error instanceof ProtocolRuleError && /illegal transition/.test(error.message),
      states.join(" > "),
    );
  }
});

test("leaving a terminal state or settling from a hold is rejected", () => {
  const base = getScenario("cocoa-rice");
  const illegal: ProtocolState[][] = [
    ["listed", "matched", "terms_recorded", "inspection_hold", "settled"],
    ["listed", "matched", "terms_recorded", "inspection_passed", "settled", "cancelled"],
    ["listed", "cancelled", "matched"],
  ];

  for (const states of illegal) {
    assert.throws(
      () => replayScenario(withEvents(base, path(...states)), 0),
      /illegal transition/,
      states.join(" > "),
    );
  }
});

test("every legal path through the table replays", () => {
  const base = getScenario("copper-coffee");
  const legal: ProtocolState[][] = [
    ["listed", "cancelled"],
    ["listed", "matched", "countered", "countered", "terms_recorded", "cancelled"],
    ["listed", "matched", "terms_recorded", "inspection_hold", "inspection_passed", "settled"],
  ];

  for (const states of legal) {
    const scenario = withEvents(base, path(...states));
    assert.equal(replayScenario(scenario, states.length).state, states.at(-1));
  }
});

test("an event that does not start from the current state is rejected", () => {
  const scenario = getScenario("copper-coffee");
  const events = [...scenario.events];
  events[1] = { ...events[1], from: "listed" };

  assert.throws(() => replayScenario(withEvents(scenario, events), 0), /starts from listed/);
});

test("out-of-order sequence numbers are rejected", () => {
  const scenario = getScenario("copper-coffee");
  const events = [...scenario.events];
  events[2] = { ...events[2], sequence: 4 };

  assert.throws(() => replayScenario(withEvents(scenario, events), 0), /out of order/);
});

test("a broken event later in the journal fails even at step zero", () => {
  const scenario = getScenario("wheat-urea");
  // Drop the inspection so the last event settles straight from recorded terms.
  const settle = { ...scenario.events[4], sequence: 4, from: "terms_recorded" as const };
  const events = [...scenario.events.slice(0, 3), settle];

  assert.throws(
    () => replayScenario(withEvents(scenario, events), 0),
    /illegal transition terms_recorded > settled/,
  );
});

test("only a counter-offer can amend a leg, and only to a positive quantity", () => {
  const scenario = getScenario("wheat-urea");
  const zero = scenario.events.map((item) =>
    item.amend ? { ...item, amend: { ...item.amend, quantity: 0 } } : item,
  );
  const misplaced = scenario.events.map((item, index) =>
    index === 2 ? { ...item, amend: { leg: "requested" as const, quantity: 900 } } : item,
  );

  assert.throws(() => replayScenario(withEvents(scenario, zero), 0), /invalid amended quantity/);
  assert.throws(
    () => replayScenario(withEvents(scenario, misplaced), 0),
    /only a counter-offer can amend/,
  );
});

test("the counter-offer amends the wheat leg from step 2 onward", () => {
  const expected = [
    { step: 0, quantity: 1_200, deltaUsd: 8_900 },
    { step: 1, quantity: 1_200, deltaUsd: 8_900 },
    { step: 2, quantity: 1_174.4, deltaUsd: 16.8 },
    { step: 5, quantity: 1_174.4, deltaUsd: 16.8 },
  ];

  for (const { step, quantity, deltaUsd } of expected) {
    const snapshot = replayScenario("wheat-urea", step);

    assert.equal(snapshot.offered.quantity, quantity, `offered quantity at step ${step}`);
    assert.equal(snapshot.requested.quantity, 1_000, `requested quantity at step ${step}`);
    assert.equal(snapshot.referenceDeltaUsd, deltaUsd, `value gap at step ${step}`);
  }
});

test("the countered quantity is the balancing quantity to the nearest 0.1 t", () => {
  const scenario = getScenario("wheat-urea");
  const balancing = referenceValue(scenario.requested) / usdPerTonne("wheat-us-hrw");

  assert.equal(Math.round(balancing * 10) / 10, 1_174.4);
});

test("stepping back past an amendment restores the listed quantity", () => {
  const scenario = getScenario("wheat-urea");

  assert.equal(replayScenario(scenario, 5).offered.quantity, 1_174.4);
  assert.deepEqual(replayScenario(scenario, 1).offered, scenario.offered);
  assert.equal(scenario.offered.quantity, 1_200);
});

test("matched lots that the copy calls balanced are within 0.1% at the reference prices", () => {
  for (const id of ["copper-coffee", "cocoa-rice"]) {
    const scenario = getScenario(id);
    const offered = referenceValue(scenario.offered);
    const requested = referenceValue(scenario.requested);

    assert.ok(Math.abs(offered - requested) / Math.max(offered, requested) < 0.001, id);
  }
});

test("the wheat synopsis gap of 2.2% and $8,900 matches the prices", () => {
  const scenario = getScenario("wheat-urea");
  const gap = referenceValue(scenario.offered) - referenceValue(scenario.requested);

  assert.equal(gap, 8_900);
  assert.equal(Math.round((gap / referenceValue(scenario.requested)) * 1000) / 10, 2.2);
});

test("leg prices come from the Pink Sheet extract", () => {
  assert.equal(priceSource.period, "2026-09");
  assert.equal(priceSource.licence, "CC BY 4.0");
  assert.equal(usdPerTonne("copper"), pinkSheet.series.copper.value);
  assert.equal(usdPerTonne("coffee-arabica"), pinkSheet.series["coffee-arabica"].value * 1000);
  assert.equal(usdPerTonne("cocoa"), pinkSheet.series.cocoa.value * 1000);

  for (const scenario of protocolScenarios) {
    for (const leg of [scenario.offered, scenario.requested]) {
      assert.ok(leg.priceSeries in pinkSheet.series, `${scenario.id}: ${leg.priceSeries}`);
    }
  }
});

test("sha256 matches node:crypto and the FIPS 180-4 vectors", () => {
  assert.equal(
    sha256("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.equal(
    sha256(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );

  for (const text of ["a".repeat(55), "a".repeat(56), "a".repeat(64), "é→✓", "x".repeat(1000)]) {
    assert.equal(sha256(text), nodeSha256(text), `length ${text.length}`);
  }
});

test("the journal hash is a SHA-256 chain anyone can recompute", () => {
  for (const scenario of protocolScenarios) {
    let head = nodeSha256(genesisEntry(scenario));
    assert.equal(replayScenario(scenario, 0).journalHash, head);

    scenario.events.forEach((item, index) => {
      head = nodeSha256(`${head}\n${eventEntry(item)}`);
      assert.equal(chainHash(replayScenario(scenario, index).journalHash, eventEntry(item)), head);
      assert.equal(replayScenario(scenario, index + 1).journalHash, head, `${scenario.id} step ${index + 1}`);
    });
  }
});

test("the hash covers amendments and leg terms", () => {
  const scenario = getScenario("wheat-urea");
  const altered = withEvents(
    scenario,
    scenario.events.map((item) =>
      item.amend ? { ...item, amend: { ...item.amend, quantity: 1_174.5 } } : item,
    ),
  );
  const relisted = { ...scenario, requested: { ...scenario.requested, quantity: 999 } };

  assert.equal(replayScenario(altered, 1).journalHash, replayScenario(scenario, 1).journalHash);
  assert.notEqual(replayScenario(altered, 2).journalHash, replayScenario(scenario, 2).journalHash);
  assert.notEqual(replayScenario(relisted, 0).journalHash, replayScenario(scenario, 0).journalHash);
});

test("journal heads are pinned so any change to a fixture is visible in review", () => {
  const heads = Object.fromEntries(
    protocolScenarios.map((scenario) => [
      scenario.id,
      replayScenario(scenario, scenario.events.length).journalHash,
    ]),
  );

  assert.deepEqual(heads, {
    "copper-coffee": "ec4bccb186684bd7a6d027ba0cd78c24b875bbbdf65450341ce29e515d9be9e9",
    "wheat-urea": "f715dc909a0bd0157baae7a30245e592a4a0f281c323a71a4128e4509edc983e",
    "cocoa-rice": "13afceea7f9f722cedf5e9011435f2ca1cbaaf816dad1eb235e60f7b76a48045",
  });
});
