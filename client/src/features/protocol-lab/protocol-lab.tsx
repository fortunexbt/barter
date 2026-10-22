import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import {
  getScenario,
  protocolScenarios,
  protocolStateLabel,
  replayScenario,
  type CommodityLeg,
} from "./demo-engine";
import { EventTape } from "./event-tape";
import { StateDiagram } from "./state-diagram";
import { stateTone } from "./state-tone";

const STEP_MS = 1_150;
const AUTOPLAY_DELAY_MS = 900;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const quantity = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

const stateCopy = {
  listed: "Both lots are on the sheet. Nothing is agreed yet.",
  matched: "The desk found a pair that fits value and delivery limits.",
  countered: "One side changed the quantity. The new figure needs recording.",
  terms_recorded: "Quantity, window and inspection rule are written to the journal.",
  inspection_hold: "An inspection reading broke the agreed limit. The trade cannot move forward.",
  inspection_passed: "Both certificates meet the rule. Clearing can close the trade.",
  settled: "Both legs are closed in the journal. Nothing real moved.",
  cancelled: "The cancellation rule fired. Neither leg is shown as transferred.",
} as const;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(reducedMotionQuery);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(reducedMotionQuery).matches,
  );
}

function readInitialReplay() {
  const params = new URLSearchParams(window.location.search);
  const scenario = getScenario(params.get("scenario") ?? protocolScenarios[0].id);
  const step = params.get("step");
  return {
    scenarioId: scenario.id,
    step: step === null ? 0 : replayScenario(scenario, Number(step) || 0).appliedSteps,
    deepLinked: step !== null,
  };
}

function signedMoney(value: number) {
  if (value === 0) return money.format(0);
  return `${value > 0 ? "+" : "−"}${money.format(Math.abs(value))}`;
}

function Leg({ side, leg }: { side: string; leg: CommodityLeg }) {
  return (
    <div className="leg">
      <p className="leg-side">{side}</p>
      <p className="leg-name">
        {quantity.format(leg.quantity)} {leg.unit} {leg.commodity.toLowerCase()}
      </p>
      <p className="leg-meta">
        {leg.grade}, from {leg.origin}
      </p>
      <p className="leg-value">{money.format(leg.quantity * leg.referenceValueUsd)} on the fixed sheet</p>
    </div>
  );
}

export default function ProtocolLab() {
  const [initial] = useState(readInitialReplay);
  const [scenarioId, setScenarioId] = useState(initial.scenarioId);
  const [step, setStep] = useState(initial.step);
  const [isPlaying, setIsPlaying] = useState(false);
  const autoplay = useRef<number | undefined>(undefined);
  const reducedMotion = useReducedMotion();
  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);
  const snapshot = useMemo(() => replayScenario(scenario, step), [scenario, step]);
  const tone = stateTone[snapshot.state];
  const lastEntry = snapshot.journal.at(-1);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("scenario", scenario.id);
    url.searchParams.set("step", String(step));
    window.history.replaceState(null, "", url);
  }, [scenario.id, step]);

  // First visit: run the first tape once so the machine is moving before anyone clicks.
  useEffect(() => {
    if (initial.deepLinked || reducedMotion) return undefined;
    autoplay.current = window.setTimeout(() => setIsPlaying(true), AUTOPLAY_DELAY_MS);
    return () => window.clearTimeout(autoplay.current);
    // Only the first render decides; later preference changes are handled by the play button.
  }, []);

  useEffect(() => {
    if (!isPlaying) return undefined;
    if (snapshot.isComplete) {
      setIsPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setStep((current) => current + 1), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [isPlaying, snapshot.isComplete, step]);

  const takeOver = () => {
    window.clearTimeout(autoplay.current);
    setIsPlaying(false);
  };

  const scrubTo = (next: number) => {
    takeOver();
    setStep(replayScenario(scenario, next).appliedSteps);
  };

  const selectScenario = (id: string) => {
    takeOver();
    setScenarioId(id);
    setStep(0);
  };

  const togglePlay = () => {
    window.clearTimeout(autoplay.current);
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (snapshot.isComplete) setStep(0);
    setIsPlaying(true);
  };

  return (
    <main className="lab" data-tone={tone}>
      <a className="skip-link" href="#desk">
        Skip to the replay desk
      </a>

      <header className="masthead">
        <a className="wordmark" href="/" aria-label="Barter Protocol Lab, start over">
          <span className="wordmark-mark" aria-hidden="true">
            B/
          </span>
          <span>Barter Protocol Lab</span>
        </a>
        <nav className="masthead-links" aria-label="Page">
          <a href="#status">What is real</a>
          <a href="https://github.com/fortunexbt/barter" target="_blank" rel="noreferrer">
            Source
          </a>
        </nav>
      </header>

      <section className="intro" aria-labelledby="title">
        <h1 id="title">Replay a commodity barter one journal entry at a time.</h1>
        <p>
          Three synthetic swaps run through the same state machine. Drag the tape to
          rewind or skip ahead. Each state is recomputed from the journal in your browser,
          and nothing is sent anywhere.
        </p>
      </section>

      <section className="desk" id="desk" aria-label="Replay desk">
        <div className="scenarios" role="group" aria-label="Choose a trade">
          {protocolScenarios.map((item) => (
            <button
              className="scenario"
              data-tone={item.tone}
              aria-pressed={item.id === scenario.id}
              key={item.id}
              onClick={() => selectScenario(item.id)}
              type="button"
            >
              <span className="scenario-kind">{item.shortTitle}</span>
              <span className="scenario-title">{item.title}</span>
              <span className="scenario-folio">{item.folio}</span>
            </button>
          ))}
        </div>

        <div className="board">
          <figure className="machine">
            <StateDiagram
              scenario={scenario}
              snapshot={snapshot}
              reducedMotion={reducedMotion}
              onJump={scrubTo}
            />
            <figcaption>
              All eight states and every transition the three trades use. This trade’s path
              is drawn solid; tap a state on it to jump there. Double rings are final.
            </figcaption>
          </figure>

          <aside className="readout" aria-label="Current state">
            <p className="stamp" key={`${scenario.id}-${snapshot.state}`} aria-live="polite">
              {protocolStateLabel(snapshot.state)}
            </p>
            <p className="readout-copy">{stateCopy[snapshot.state]}</p>
            <dl className="facts">
              <div>
                <dt>Journal mark</dt>
                <dd className="mono">{snapshot.fingerprint}</dd>
              </div>
              <div>
                <dt>Entries</dt>
                <dd className="mono">
                  {snapshot.appliedSteps} of {scenario.events.length}
                </dd>
              </div>
              <div>
                <dt>Value gap</dt>
                <dd className="mono">{signedMoney(snapshot.referenceDeltaUsd)}</dd>
              </div>
              <div>
                <dt>Next</dt>
                <dd>{snapshot.nextEvent?.action ?? scenario.outcome}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <div className="tape-deck">
          <EventTape scenario={scenario} step={step} onScrub={scrubTo} />
          <div className="controls">
            <button className="control-primary" type="button" onClick={togglePlay}>
              {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
              {isPlaying ? "Pause" : snapshot.isComplete ? "Replay tape" : "Run tape"}
            </button>
            <button type="button" onClick={() => scrubTo(step - 1)} disabled={step === 0}>
              <ChevronLeft size={16} aria-hidden="true" /> Back
            </button>
            <button type="button" onClick={() => scrubTo(step + 1)} disabled={snapshot.isComplete}>
              Advance <ChevronRight size={16} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => scrubTo(0)} disabled={step === 0}>
              <RotateCcw size={15} aria-hidden="true" /> Rewind
            </button>
            <p className="controls-hint">Drag the tape or focus it and use the arrow keys.</p>
          </div>
          <p className="tape-note">
            The holes in each frame spell that entry’s journal mark in binary. Rewinding
            un-punches them because the state is derived, never stored.
          </p>
        </div>

        <div className="ledger">
          <section className="lots" aria-labelledby="lots-title">
            <h2 id="lots-title">{scenario.route}</h2>
            <p className="lots-synopsis">{scenario.synopsis}</p>
            <div className="legs">
              <Leg side="Offers" leg={scenario.offered} />
              <Leg side="Wants" leg={scenario.requested} />
            </div>
            <p className="lots-note">
              Reference values are fixed fixtures, not market prices.
            </p>
          </section>

          <section className="journal" aria-labelledby="journal-title">
            <h2 id="journal-title">Journal {scenario.folio}</h2>
            <ol>
              {scenario.events.map((event, index) => (
                <li
                  key={event.id}
                  data-applied={index < snapshot.appliedSteps}
                  data-latest={event.id === lastEntry?.id}
                >
                  <button type="button" onClick={() => scrubTo(index + 1)}>
                    <span className="journal-seq mono">{String(event.sequence).padStart(2, "0")}</span>
                    <span className="journal-body">
                      <span className="journal-head">
                        <strong>{event.action}</strong>
                        <span className="mono">{event.at}</span>
                      </span>
                      <span className="journal-detail">{event.detail}</span>
                      <span className="journal-meta">
                        {event.actor}. {protocolStateLabel(event.from)} to{" "}
                        {protocolStateLabel(event.to)}. <span className="mono">{event.evidence}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>

      <section className="status" id="status" aria-labelledby="status-title">
        <h2 id="status-title">What is real here</h2>
        <div className="status-grid">
          <article>
            <h3>Real code</h3>
            <p>
              The reducer that replays each journal, rejects transitions that skip a state,
              clamps out-of-range steps and computes the journal mark. It is the same module
              the tests run against.
            </p>
          </article>
          <article>
            <h3>Synthetic data</h3>
            <p>
              Counterparties, reference prices, inspection readings and certificates. Every
              timestamp and value is a fixed fixture, so the same step always gives the same
              mark.
            </p>
          </article>
          <article>
            <h3>Not built</h3>
            <p>
              Accounts, live prices, payments, title transfer, custody, logistics and any
              chain anchoring. This is a model of the protocol, not an exchange.
            </p>
          </article>
        </div>
      </section>

      <footer className="footer">
        <p>Synthetic data. No money, title or commodity moves. MIT licensed.</p>
        <a href="https://github.com/fortunexbt/barter" target="_blank" rel="noreferrer">
          github.com/fortunexbt/barter
        </a>
      </footer>
    </main>
  );
}
