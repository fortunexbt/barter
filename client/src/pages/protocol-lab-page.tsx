import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Github, Pause, Play, RotateCcw } from "lucide-react";
import {
  getScenario,
  protocolScenarios,
  protocolStateLabel,
  replayScenario,
  type CommodityLeg,
  type ProtocolScenario,
  type ProtocolState,
  type ReplaySnapshot,
} from "@/features/protocol-lab/demo-engine";

const RUN_INTERVAL_MS = 900;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const cents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const quantity = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

type StateTone = "idle" | "active" | "hold" | "done" | "stopped";

const stateTone: Record<ProtocolState, StateTone> = {
  listed: "idle",
  matched: "active",
  countered: "active",
  terms_recorded: "active",
  inspection_passed: "active",
  inspection_hold: "hold",
  settled: "done",
  cancelled: "stopped",
};

// Terminal states show the scenario's own outcome instead.
const stateCopy: Record<Exclude<ProtocolState, "settled" | "cancelled">, string> = {
  listed: "Both lots are on the book and waiting for a match.",
  matched: "The matching desk has paired the two lots.",
  countered: "A counter-offer changed the quantity and still has to be recorded.",
  terms_recorded: "Both parties' terms are written to the journal.",
  inspection_hold: "Inspection flagged a variance and progress is blocked.",
  inspection_passed: "Both inspection certificates meet the scenario rules.",
};

function stateName(state: ProtocolState) {
  const label = protocolStateLabel(state);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function unitPrice(value: number) {
  return Number.isInteger(value) ? money.format(value) : cents.format(value);
}

function signedMoney(value: number) {
  if (value === 0) return money.format(0);
  return `${value > 0 ? "+" : "−"}${money.format(Math.abs(value))}`;
}

function readInitialScenario() {
  const id = new URLSearchParams(window.location.search).get("scenario");
  return getScenario(id ?? protocolScenarios[0].id).id;
}

export default function ProtocolLabPage() {
  const [scenarioId, setScenarioId] = useState(readInitialScenario);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);
  const snapshot = useMemo(() => replayScenario(scenario, step), [scenario, step]);
  const stepCount = scenario.events.length;

  useEffect(() => {
    document.title = `${scenario.folio} | Barter Protocol Lab`;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("scenario", scenario.id);
    window.history.replaceState(null, "", nextUrl);
  }, [scenario]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    if (snapshot.isComplete) {
      setIsPlaying(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setStep((current) => Math.min(current + 1, stepCount));
    }, RUN_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [isPlaying, step, stepCount, snapshot.isComplete]);

  const selectScenario = (id: string) => {
    setScenarioId(id);
    setStep(0);
    setIsPlaying(false);
  };

  const stepTo = (next: number) => {
    setStep(Math.max(0, Math.min(next, stepCount)));
    setIsPlaying(false);
  };

  // Starting the tape applies the next event at once so the click has visible feedback.
  const togglePlaying = () => {
    if (!isPlaying) {
      setStep((current) => Math.min(current + 1, stepCount));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <main className="protocol-lab">
      <header className="protocol-header">
        <a className="protocol-brand" href={import.meta.env.BASE_URL}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 7h12.5M12 3.5 15.5 7 12 10.5M17 13H4.5M8 9.5 4.5 13 8 16.5" />
          </svg>
          Barter Protocol Lab
        </a>
        <p className="protocol-intro">
          A commodity barter state machine, replayed from a fixed event journal. Every party,
          price and document is synthetic.
        </p>
        <a
          className="protocol-source"
          href="https://github.com/fortunexbt/barter"
          target="_blank"
          rel="noreferrer"
        >
          <Github size={15} aria-hidden="true" />
          Source
        </a>
      </header>

      <section className="protocol-console" aria-label="Protocol replay">
        <div className="protocol-toolbar">
          <div className="protocol-picker" role="group" aria-label="Scenario">
            {protocolScenarios.map((item) => (
              <button
                aria-pressed={item.id === scenario.id}
                key={item.id}
                onClick={() => selectScenario(item.id)}
                type="button"
              >
                {item.shortTitle}
              </button>
            ))}
          </div>

          <div className="protocol-transport" role="group" aria-label="Replay controls">
            <button type="button" onClick={() => stepTo(0)} disabled={step === 0}>
              <RotateCcw size={15} aria-hidden="true" />
              Reset
            </button>
            <button type="button" onClick={() => stepTo(step - 1)} disabled={step === 0}>
              <ChevronLeft size={17} aria-hidden="true" />
              Back
            </button>
            <button
              className="protocol-primary"
              type="button"
              onClick={() => stepTo(step + 1)}
              disabled={snapshot.isComplete}
            >
              Advance
              <ChevronRight size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={togglePlaying}
              disabled={snapshot.isComplete}
              aria-pressed={isPlaying}
            >
              {isPlaying ? (
                <Pause size={15} aria-hidden="true" />
              ) : (
                <Play size={15} aria-hidden="true" />
              )}
              {isPlaying ? "Pause" : "Run tape"}
            </button>
          </div>
        </div>

        <div className="protocol-summary">
          <div className="protocol-scenario">
            <h1>{scenario.title}</h1>
            <p className="protocol-route">
              <span className="protocol-mono">{scenario.folio}</span>
              <span>{scenario.route}</span>
            </p>
            <p className="protocol-synopsis">{scenario.synopsis}</p>
          </div>

          <div className="protocol-status" data-tone={stateTone[snapshot.state]}>
            <p className="protocol-status-label">Derived state</p>
            <p className="protocol-status-name" key={snapshot.state}>
              <span className="protocol-status-dot" aria-hidden="true" />
              {stateName(snapshot.state)}
            </p>
            <p className="protocol-status-copy">
              {snapshot.state === "settled" || snapshot.state === "cancelled"
                ? scenario.outcome
                : stateCopy[snapshot.state]}
            </p>
          </div>
        </div>

        <StateTrack scenario={scenario} snapshot={snapshot} />

        <div className="protocol-body">
          <section className="protocol-legs" aria-labelledby="protocol-legs-title">
            <h2 id="protocol-legs-title">Exchange legs</h2>
            <LegRow label="Offered" leg={scenario.offered} />
            <LegRow label="Requested" leg={scenario.requested} />
            <div className="protocol-gap">
              <div>
                <span>Value gap</span>
                <small>Offered minus requested</small>
              </div>
              <strong>{signedMoney(snapshot.referenceDeltaUsd)}</strong>
            </div>
          </section>

          <section className="protocol-journal" aria-labelledby="protocol-journal-title">
            <h2 id="protocol-journal-title">Event journal</h2>
            <ol>
              {scenario.events.map((event, index) => (
                <li
                  data-applied={index < snapshot.appliedSteps}
                  data-latest={index === snapshot.appliedSteps - 1}
                  data-next={index === snapshot.appliedSteps}
                  key={event.id}
                >
                  <span className="protocol-seq">{event.sequence}</span>
                  <time className="protocol-event-time">{event.at}</time>
                  <div className="protocol-event">
                    <p className="protocol-event-action">{event.action}</p>
                    <p className="protocol-event-detail">{event.detail}</p>
                    <p className="protocol-event-meta">
                      <span>{event.actor}</span>
                      <span className="protocol-mono">{event.evidence}</span>
                    </p>
                  </div>
                  <span className="protocol-event-to" data-tone={stateTone[event.to]}>
                    {stateName(event.to)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <footer className="protocol-statusbar">
          <span>
            Step {snapshot.appliedSteps} of {stepCount}
          </span>
          <span>
            Journal hash <span className="protocol-mono">{snapshot.fingerprint}</span>
          </span>
        </footer>
      </section>

      <p className="protocol-sr-only" aria-live="polite">
        {`Step ${snapshot.appliedSteps} of ${stepCount}. ${stateName(snapshot.state)}.`}
      </p>
    </main>
  );
}

function StateTrack({
  scenario,
  snapshot,
}: {
  scenario: ProtocolScenario;
  snapshot: ReplaySnapshot;
}) {
  const path = [scenario.initialState, ...scenario.events.map((event) => event.to)];

  return (
    <ol
      className="protocol-track"
      aria-label="State path"
      data-tone={stateTone[snapshot.state]}
      style={{ gridTemplateColumns: `repeat(${path.length}, minmax(0, 1fr))` }}
    >
      {path.map((state, index) => {
        const isReached = index <= snapshot.appliedSteps;
        const isCurrent = index === snapshot.appliedSteps;

        return (
          <li
            aria-current={isCurrent ? "step" : undefined}
            data-current={isCurrent}
            data-reached={isReached}
            key={`${state}-${index}`}
          >
            {index > 0 && (
              <span className="protocol-track-line" aria-hidden="true">
                <span />
              </span>
            )}
            <span className="protocol-track-node" aria-hidden="true" />
            <span className="protocol-track-label">{stateName(state)}</span>
            <time className="protocol-track-time">
              {index === 0 ? "Start" : scenario.events[index - 1].at}
            </time>
          </li>
        );
      })}
    </ol>
  );
}

function LegRow({ label, leg }: { label: string; leg: CommodityLeg }) {
  return (
    <div className="protocol-leg">
      <p className="protocol-leg-side">{label}</p>
      <p className="protocol-leg-name">{leg.commodity}</p>
      <p className="protocol-leg-grade">
        {leg.grade}, {leg.origin}
      </p>
      <p className="protocol-leg-figures">
        <span>
          {quantity.format(leg.quantity)} {leg.unit} at {unitPrice(leg.referenceValueUsd)}
        </span>
        <strong>{money.format(leg.quantity * leg.referenceValueUsd)}</strong>
      </p>
    </div>
  );
}
