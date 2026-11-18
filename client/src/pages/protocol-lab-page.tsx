import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Github, Pause, Play, RotateCcw } from "lucide-react";
import {
  eventEntry,
  genesisEntry,
  getScenario,
  protocolScenarios,
  protocolStateLabel,
  referenceValue,
  replayScenario,
  type CommodityLeg,
  type ProtocolScenario,
  type ProtocolState,
  type ReplaySnapshot,
} from "@/features/protocol-lab/demo-engine";
import { priceSource, usdPerTonne } from "@/features/protocol-lab/reference-prices";

const RUN_INTERVAL_MS = 900;

// The beam leans 3.5° for every 1% the offered leg is worth over the requested one, up to 8°.
const TILT_PER_PERCENT = 3.5;
const MAX_TILT = 8;

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

const priceMonth = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${priceSource.period}-01T00:00:00Z`));

function signedMoney(value: number) {
  if (value === 0) return money.format(0);
  return `${value > 0 ? "+" : "−"}${money.format(Math.abs(value))}`;
}

function gapShare(snapshot: ReplaySnapshot) {
  return (snapshot.referenceDeltaUsd / referenceValue(snapshot.requested)) * 100;
}

function formatShare(percent: number) {
  const size = Math.abs(percent);
  if (size === 0) return "0%";
  if (size < 0.01) return "under 0.01%";
  return `${size.toFixed(size < 1 ? 2 : 1)}%`;
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
  // One replay per step, so every journal line can show the head it produced.
  const replays = useMemo(
    () => Array.from({ length: scenario.events.length + 1 }, (_, index) => replayScenario(scenario, index)),
    [scenario],
  );
  const snapshot = replays[step];
  const stepCount = scenario.events.length;
  const latest = snapshot.journal.at(-1);

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
    <main className="lab" data-tone={stateTone[snapshot.state]}>
      <header className="lab-header">
        <a className="lab-brand" href={import.meta.env.BASE_URL}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v17M5 20h14M3 8h18M3 8l-2 6h6zM21 8l-2 6h6z" />
          </svg>
          Barter Protocol Lab
        </a>
        <div className="lab-picker" role="group" aria-label="Scenario">
          {protocolScenarios.map((item) => (
            <button
              aria-pressed={item.id === scenario.id}
              key={item.id}
              onClick={() => selectScenario(item.id)}
              type="button"
            >
              <span className="lab-picker-name">{item.shortTitle}</span>
              <span className="lab-picker-folio">{item.folio}</span>
            </button>
          ))}
        </div>
        <a
          className="lab-source"
          href="https://github.com/fortunexbt/barter"
          target="_blank"
          rel="noreferrer"
        >
          <Github size={15} aria-hidden="true" />
          Source
        </a>
      </header>

      <div className="lab-floor">
        <section className="lab-stage" aria-labelledby="lab-title">
          <div className="lab-heading">
            <div>
              <h1 id="lab-title">{scenario.title}</h1>
              <p className="lab-synopsis">{scenario.synopsis}</p>
            </div>
            <StateStamp scenario={scenario} snapshot={snapshot} />
          </div>

          <Balance scenario={scenario} snapshot={snapshot} />

          <div className="lab-controls">
            <div className="lab-transport" role="group" aria-label="Replay controls">
              <button type="button" onClick={() => stepTo(0)} disabled={step === 0}>
                <RotateCcw size={15} aria-hidden="true" />
                Reset
              </button>
              <button type="button" onClick={() => stepTo(step - 1)} disabled={step === 0}>
                <ChevronLeft size={17} aria-hidden="true" />
                Back
              </button>
              <button
                className="lab-advance"
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
            <StateRoute scenario={scenario} snapshot={snapshot} />
          </div>

          <p className="lab-caveat">
            Prices are{" "}
            <a href={priceSource.page} target="_blank" rel="noreferrer">
              World Bank Pink Sheet averages for {priceMonth}
            </a>{" "}
            ({priceSource.licence}). Parties, documents and inspection readings are invented,
            and nothing moves money, title or goods.
          </p>
        </section>

        <Journal scenario={scenario} replays={replays} snapshot={snapshot} latestId={latest?.id} />
      </div>

      <p className="lab-sr-only" aria-live="polite">
        {`Step ${snapshot.appliedSteps} of ${stepCount}. ${stateName(snapshot.state)}. Value gap ${signedMoney(snapshot.referenceDeltaUsd)}.`}
      </p>
    </main>
  );
}

function StateStamp({
  scenario,
  snapshot,
}: {
  scenario: ProtocolScenario;
  snapshot: ReplaySnapshot;
}) {
  const latest = snapshot.journal.at(-1);
  const isTerminal = snapshot.state === "settled" || snapshot.state === "cancelled";

  return (
    <div className="lab-state">
      <p className="lab-stamp" key={`${scenario.id}-${snapshot.appliedSteps}`}>
        <span className="lab-sr-only">Derived state </span>
        <span className="lab-stamp-name">{stateName(snapshot.state)}</span>
        <span className="lab-stamp-meta">
          {latest ? `${latest.at} ${latest.evidence}` : `${scenario.folio} opened`}
        </span>
      </p>
      <p className="lab-state-copy">
        {isTerminal ? scenario.outcome : stateCopy[snapshot.state as keyof typeof stateCopy]}
      </p>
    </div>
  );
}

function Balance({
  scenario,
  snapshot,
}: {
  scenario: ProtocolScenario;
  snapshot: ReplaySnapshot;
}) {
  const share = gapShare(snapshot);
  const lean = Math.max(-MAX_TILT, Math.min(MAX_TILT, share * TILT_PER_PERCENT));
  const heavier =
    snapshot.referenceDeltaUsd === 0
      ? "Both legs carry the same reference value."
      : `The ${snapshot.referenceDeltaUsd > 0 ? "offered" : "requested"} leg is worth ${formatShare(share)} more.`;

  return (
    <section
      className="lab-balance"
      aria-labelledby="lab-balance-title"
      style={{ "--tilt": `${-lean}deg` } as CSSProperties}
    >
      <h2 id="lab-balance-title" className="lab-sr-only">
        Exchange legs
      </h2>
      <div className="lab-rig" aria-hidden="true">
        <svg className="lab-dial" viewBox="0 0 120 64">
          <path d="M14 58a46 46 0 0 1 92 0" />
          <line x1="60" y1="6" x2="60" y2="20" />
        </svg>
        <span className="lab-beam">
          <span className="lab-needle" />
        </span>
        <span className="lab-pivot" />
      </div>

      <div className="lab-pans">
        <Pan side="offered" leg={snapshot.offered} listed={scenario.offered} />
        <span className="lab-pillar" aria-hidden="true" />
        <Pan side="requested" leg={snapshot.requested} listed={scenario.requested} />
      </div>

      <div className="lab-gap">
        <p className="lab-gap-figure">
          <span className="lab-gap-label">Value gap</span>
          <strong key={snapshot.referenceDeltaUsd}>{signedMoney(snapshot.referenceDeltaUsd)}</strong>
        </p>
        <p className="lab-gap-note">
          Offered minus requested at reference prices. {heavier}
        </p>
      </div>
    </section>
  );
}

function Pan({
  side,
  leg,
  listed,
}: {
  side: "offered" | "requested";
  leg: CommodityLeg;
  listed: CommodityLeg;
}) {
  const isAmended = leg.quantity !== listed.quantity;

  return (
    <div className="lab-pan" data-side={side} data-amended={isAmended}>
      <svg className="lab-hanger" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M50 0 4 40M50 0l46 40" />
      </svg>
      <div className="lab-tray">
        <p className="lab-tray-side">
          <span>{side === "offered" ? "Offered" : "Requested"}</span>
          {isAmended && (
            <span className="lab-tray-amended">
              <span className="lab-sr-only">Countered from </span>
              <del>{quantity.format(listed.quantity)} t</del>
            </span>
          )}
        </p>
        <h3 className="lab-tray-name">{leg.commodity}</h3>
        <p className="lab-tray-grade">{leg.grade}</p>
        <p className="lab-tray-weight">
          {isAmended && <span className="lab-sr-only">Now </span>}
          <span className="lab-tray-quantity" key={leg.quantity}>
            {quantity.format(leg.quantity)}
          </span>
          <span className="lab-tray-unit"> t</span>
        </p>
        <p className="lab-tray-value">
          <span>at {unitPrice(usdPerTonne(leg.priceSeries))}/t</span>
          <strong>{money.format(referenceValue(leg))}</strong>
        </p>
      </div>
    </div>
  );
}

function StateRoute({
  scenario,
  snapshot,
}: {
  scenario: ProtocolScenario;
  snapshot: ReplaySnapshot;
}) {
  const path = [scenario.initialState, ...scenario.events.map((event) => event.to)];

  return (
    <ol className="lab-route" aria-label="State path">
      {path.map((state, index) => {
        const isCurrent = index === snapshot.appliedSteps;

        return (
          <li
            aria-current={isCurrent ? "step" : undefined}
            data-current={isCurrent}
            data-reached={index <= snapshot.appliedSteps}
            data-tone={stateTone[state]}
            key={`${state}-${index}`}
          >
            {stateName(state)}
          </li>
        );
      })}
    </ol>
  );
}

function Journal({
  scenario,
  replays,
  snapshot,
  latestId,
}: {
  scenario: ProtocolScenario;
  replays: readonly ReplaySnapshot[];
  snapshot: ReplaySnapshot;
  latestId: string | undefined;
}) {
  const head = snapshot.journalHash;

  return (
    <section className="lab-journal" aria-labelledby="lab-journal-title">
      <header className="lab-journal-header">
        <h2 id="lab-journal-title">Event journal</h2>
        <p className="lab-folio">{scenario.folio}</p>
        <p className="lab-journal-rule">
          Each head is the SHA-256 of the previous head, a newline and the entry.
        </p>
      </header>

      <ol className="lab-ledger">
        <li
          className="lab-line"
          data-applied="true"
          data-latest={latestId === undefined}
          data-genesis="true"
        >
          <span className="lab-seq" aria-hidden="true">0</span>
          <div className="lab-line-body">
            <p className="lab-line-action">Genesis</p>
            {latestId === undefined && <p className="lab-entry">{genesisEntry(scenario)}</p>}
            <p className="lab-head">
              <span className="lab-head-key">head</span>
              {replays[0].journalHash.slice(0, 16)}
            </p>
          </div>
        </li>
        {scenario.events.map((event, index) => {
          const isApplied = index < snapshot.appliedSteps;
          const isLatest = event.id === latestId;

          return (
            <li
              className="lab-line"
              data-applied={isApplied}
              data-latest={isLatest}
              data-tone={stateTone[event.to]}
              key={event.id}
            >
              <span className="lab-seq" aria-hidden="true">{event.sequence}</span>
              <div className="lab-line-body">
                <p className="lab-line-action">
                  <span>{event.action}</span>
                  <time>{event.at}</time>
                </p>
                {isApplied && (
                  <p className="lab-line-meta">
                    <span>{event.actor}</span>
                    <span className="lab-ref">{event.evidence}</span>
                  </p>
                )}
                {isLatest && (
                  <>
                    <p className="lab-line-detail">{event.detail}</p>
                    <p className="lab-entry">{eventEntry(event)}</p>
                  </>
                )}
                {isApplied && (
                  <p className="lab-head">
                    <span className="lab-head-key">head</span>
                    {replays[index + 1].journalHash.slice(0, 16)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="lab-journal-foot">
        <p className="lab-foot-label">
          Journal head after step {snapshot.appliedSteps} of {scenario.events.length}
        </p>
        <p className="lab-hash" key={head} title={head}>
          {head.match(/.{16}/g)?.map((chunk, index) => (
            <span key={index}>{chunk}</span>
          ))}
        </p>
      </footer>
    </section>
  );
}
