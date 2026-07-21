import assert from "node:assert/strict";
import test from "node:test";
import {
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
