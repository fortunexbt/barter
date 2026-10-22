import assert from "node:assert/strict";
import test from "node:test";
import {
  getScenario,
  protocolScenarios,
  replayScenario,
  type ProtocolScenario,
} from "./demo-engine";

test("all three fixtures replay to their declared terminal state", () => {
  assert.equal(protocolScenarios.length, 3);

  const terminalStates = protocolScenarios.map((scenario) =>
    replayScenario(scenario, scenario.events.length).state,
  );

  assert.deepEqual(terminalStates, ["settled", "settled", "cancelled"]);
});

test("a replay is deterministic at every step", () => {
  for (const scenario of protocolScenarios) {
    for (let step = 0; step <= scenario.events.length; step += 1) {
      assert.deepEqual(
        replayScenario(scenario, step),
        replayScenario(scenario.id, step),
      );
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

test("the counter-offer amends the wheat leg from step 2 onward", () => {
  const expected = [
    { step: 0, quantity: 420, deltaUsd: 12_440 },
    { step: 1, quantity: 420, deltaUsd: 12_440 },
    { step: 2, quantity: 387.4, deltaUsd: -13.2 },
    { step: 3, quantity: 387.4, deltaUsd: -13.2 },
    { step: 4, quantity: 387.4, deltaUsd: -13.2 },
  ];

  for (const { step, quantity, deltaUsd } of expected) {
    const snapshot = replayScenario("wheat-freight", step);

    assert.equal(snapshot.offered.quantity, quantity, `offered quantity at step ${step}`);
    assert.equal(snapshot.requested.quantity, 1, `requested quantity at step ${step}`);
    assert.equal(snapshot.referenceDeltaUsd, deltaUsd, `value gap at step ${step}`);
  }
});

test("stepping back past an amendment restores the listed quantity", () => {
  const scenario = getScenario("wheat-freight");

  assert.equal(replayScenario(scenario, 4).offered.quantity, 387.4);
  assert.equal(replayScenario(scenario, 1).offered.quantity, 420);
  assert.deepEqual(replayScenario(scenario, 1).offered, scenario.offered);
  assert.equal(scenario.offered.quantity, 420);
});

test("scenarios without amendments keep their legs and journal marks", () => {
  const marks = {
    "copper-coffee": ["24F00D13", "4906663F", "230EE650", "DEE73956", "8BBBFFF1"],
    "cocoa-hold": ["E53AD9F7", "B279AB94", "50998C24", "8F70C9A5"],
  };

  for (const [scenarioId, expectedMarks] of Object.entries(marks)) {
    const scenario = getScenario(scenarioId);

    expectedMarks.forEach((mark, step) => {
      const snapshot = replayScenario(scenario, step);

      assert.equal(snapshot.fingerprint, mark, `${scenarioId} mark at step ${step}`);
      assert.deepEqual(snapshot.offered, scenario.offered);
      assert.deepEqual(snapshot.requested, scenario.requested);
    });
  }
});

test("invalid leg amendments fail loudly", () => {
  const scenario = getScenario("wheat-freight");
  const invalidScenario: ProtocolScenario = {
    ...scenario,
    events: scenario.events.map((event) =>
      event.amend ? { ...event, amend: { ...event.amend, quantity: 0 } } : event,
    ),
  };

  assert.throws(() => replayScenario(invalidScenario, 2), /Invalid leg amendment/);
});

test("invalid state transitions fail loudly", () => {
  const scenario = protocolScenarios[0];
  const invalidScenario: ProtocolScenario = {
    ...scenario,
    events: [
      {
        ...scenario.events[0],
        from: "cancelled",
      },
    ],
  };

  assert.throws(
    () => replayScenario(invalidScenario, 1),
    /Invalid protocol transition/,
  );
});
