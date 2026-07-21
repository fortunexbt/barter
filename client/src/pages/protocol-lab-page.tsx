import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  FileCheck2,
  FlaskConical,
  Github,
  Pause,
  Play,
  RotateCcw,
  Scale,
  ShieldAlert,
  Stamp,
} from "lucide-react";
import {
  getScenario,
  protocolScenarios,
  protocolStateLabel,
  replayScenario,
} from "@/features/protocol-lab/demo-engine";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const quantity = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const stateCopy = {
  listed: "Fixture entered on the local sheet.",
  matched: "Reference constraints found a candidate pair.",
  countered: "A revised quantity is awaiting record.",
  terms_recorded: "Synthetic terms are fixed in this replay.",
  inspection_hold: "The rule engine has blocked progression.",
  inspection_passed: "Fixture evidence satisfies the demo rule.",
  settled: "Both synthetic legs are closed locally.",
  cancelled: "The scenario stopped without settlement.",
} as const;

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
  const offeredValue = scenario.offered.quantity * scenario.offered.referenceValueUsd;
  const requestedValue = scenario.requested.quantity * scenario.requested.referenceValueUsd;

  useEffect(() => {
    document.title = `${scenario.folio} · Barter Protocol Lab`;
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
      setStep((current) => Math.min(current + 1, scenario.events.length));
    }, 1_250);

    return () => window.clearTimeout(timer);
  }, [isPlaying, scenario.events.length, snapshot.isComplete]);

  const selectScenario = (id: string) => {
    setScenarioId(id);
    setStep(0);
    setIsPlaying(false);
  };

  const reset = () => {
    setStep(0);
    setIsPlaying(false);
  };

  return (
    <main className="protocol-lab min-h-screen text-[#171712]">
      <a className="protocol-skip-link" href="#protocol-workbench">
        Skip to protocol workbench
      </a>

      <header className="protocol-masthead">
        <a className="protocol-wordmark" href="/lab" aria-label="Barter Protocol Lab home">
          <span className="protocol-wordmark-mark">B/</span>
          <span>
            <strong>Barter</strong>
            <small>Protocol Lab</small>
          </span>
        </a>

        <div className="protocol-masthead-note">
          <span className="protocol-live-dot" aria-hidden="true" />
          Deterministic fixture desk · no login
        </div>

        <div className="protocol-masthead-links">
          <a href="#capabilities">Status sheet</a>
          <a
            href="https://github.com/fortunexbt/barter"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={15} aria-hidden="true" /> Source
          </a>
        </div>
      </header>

      <section className="protocol-hero" aria-labelledby="protocol-title">
        <div className="protocol-hero-copy">
          <p className="protocol-overline">Experimental commodity exchange mechanics</p>
          <h1 id="protocol-title">
            Trade logic,
            <br />
            <em>laid bare.</em>
          </h1>
          <p className="protocol-deck">
            A paper-ledger workbench for inspecting how a barter protocol could match,
            counter, hold, and close commodity exchanges—without pretending that a real
            marketplace, blockchain, escrow account, or inspection network exists.
          </p>
        </div>

        <aside className="protocol-disclosure" aria-label="Prototype disclosure">
          <FlaskConical size={22} aria-hidden="true" />
          <div>
            <strong>Runnable protocol study</strong>
            <p>
              Three fixed scenarios. Every value, party, document, and outcome is synthetic.
              Replay is local and makes no network request.
            </p>
          </div>
        </aside>
      </section>

      <section className="protocol-ticker" aria-label="Demonstration guarantees">
        <span>03 fixed scenarios</span>
        <span>00 external calls</span>
        <span>00 credentials</span>
        <span>100% replayable state</span>
        <span>Not a live exchange</span>
      </section>

      <section className="protocol-workbench" id="protocol-workbench">
        <div className="protocol-desk-heading">
          <div>
            <span className="protocol-section-number">01</span>
            <p className="protocol-overline">Clearing desk</p>
            <h2>Run a fixture through the book</h2>
          </div>
          <p>
            Pick a scenario, advance one signed-off event at a time, or run the full tape.
            Backward replay derives state from the same immutable journal.
          </p>
        </div>

        <div className="protocol-desk-grid">
          <nav className="protocol-scenario-list" aria-label="Trade scenarios">
            <div className="protocol-panel-label">Scenario index</div>
            {protocolScenarios.map((item, index) => {
              const isActive = item.id === scenario.id;

              return (
                <button
                  className="protocol-scenario-button"
                  data-active={isActive}
                  key={item.id}
                  onClick={() => selectScenario(item.id)}
                  type="button"
                  aria-pressed={isActive}
                >
                  <span className="protocol-scenario-index">0{index + 1}</span>
                  <span>
                    <small>{item.shortTitle}</small>
                    <strong>{item.title}</strong>
                    <em>{item.route}</em>
                  </span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              );
            })}

            <div className="protocol-no-network">
              <ShieldAlert size={18} aria-hidden="true" />
              <p>
                <strong>Air-gapped by design</strong>
                This workbench does not touch the authenticated prototype API.
              </p>
            </div>
          </nav>

          <article className="protocol-manifest" aria-live="polite">
            <div className="protocol-manifest-topline">
              <span>Exchange memorandum</span>
              <span>Folio {scenario.folio}</span>
            </div>

            <div className="protocol-manifest-title">
              <div>
                <p>{scenario.route}</p>
                <h3>{scenario.title}</h3>
              </div>
              <span className={`protocol-tone protocol-tone-${scenario.tone}`}>
                {scenario.shortTitle}
              </span>
            </div>

            <p className="protocol-synopsis">{scenario.synopsis}</p>

            <div className="protocol-legs" aria-label="Exchange legs">
              <div className="protocol-leg">
                <span className="protocol-leg-label">Offers</span>
                <strong>{scenario.offered.commodity}</strong>
                <p>{scenario.offered.grade}</p>
                <dl>
                  <div>
                    <dt>Origin</dt>
                    <dd>{scenario.offered.origin}</dd>
                  </div>
                  <div>
                    <dt>Quantity</dt>
                    <dd>
                      {quantity.format(scenario.offered.quantity)} {scenario.offered.unit}
                    </dd>
                  </div>
                  <div>
                    <dt>Reference</dt>
                    <dd>{money.format(offeredValue)}</dd>
                  </div>
                </dl>
              </div>

              <div className="protocol-exchange-mark" aria-hidden="true">
                ⇄
              </div>

              <div className="protocol-leg">
                <span className="protocol-leg-label">Requests</span>
                <strong>{scenario.requested.commodity}</strong>
                <p>{scenario.requested.grade}</p>
                <dl>
                  <div>
                    <dt>Origin</dt>
                    <dd>{scenario.requested.origin}</dd>
                  </div>
                  <div>
                    <dt>Quantity</dt>
                    <dd>
                      {quantity.format(scenario.requested.quantity)} {scenario.requested.unit}
                    </dd>
                  </div>
                  <div>
                    <dt>Reference</dt>
                    <dd>{money.format(requestedValue)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="protocol-value-rule">
              <Scale size={17} aria-hidden="true" />
              <span>Fixed-sheet reference delta</span>
              <strong>
                {snapshot.referenceDeltaUsd === 0
                  ? money.format(0)
                  : `${snapshot.referenceDeltaUsd > 0 ? "+" : "−"}${money.format(
                      Math.abs(snapshot.referenceDeltaUsd),
                    )}`}
              </strong>
              <small>Reference values are fixtures, not market prices.</small>
            </div>

            <div className="protocol-controls">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                disabled={step === 0}
                aria-label="Replay previous event"
              >
                <ChevronLeft size={18} aria-hidden="true" /> Back
              </button>
              <button type="button" onClick={reset} disabled={step === 0}>
                <RotateCcw size={16} aria-hidden="true" /> Reset
              </button>
              <button
                className="protocol-run-button"
                type="button"
                onClick={() => setIsPlaying((current) => !current)}
                disabled={snapshot.isComplete}
              >
                {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                {isPlaying ? "Pause tape" : "Run tape"}
              </button>
              <button
                className="protocol-next-button"
                type="button"
                onClick={() => setStep((current) => Math.min(current + 1, scenario.events.length))}
                disabled={snapshot.isComplete}
              >
                Advance <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </article>

          <aside className="protocol-state-panel">
            <div className="protocol-panel-label">Derived state</div>
            <div className={`protocol-state-stamp protocol-state-${snapshot.state}`}>
              <Stamp size={22} aria-hidden="true" />
              <span>{protocolStateLabel(snapshot.state)}</span>
            </div>
            <p className="protocol-state-copy">{stateCopy[snapshot.state]}</p>

            <div className="protocol-meter" aria-label={`${snapshot.progress}% complete`}>
              <span style={{ width: `${snapshot.progress}%` }} />
            </div>
            <div className="protocol-meter-label">
              <span>
                {snapshot.appliedSteps}/{scenario.events.length} entries
              </span>
              <span>{snapshot.progress}%</span>
            </div>

            <dl className="protocol-state-facts">
              <div>
                <dt>Journal mark</dt>
                <dd>{snapshot.fingerprint}</dd>
              </div>
              <div>
                <dt>Next rule</dt>
                <dd>{snapshot.nextEvent?.action ?? "Tape complete"}</dd>
              </div>
              <div>
                <dt>External writes</dt>
                <dd>None</dd>
              </div>
            </dl>

            {snapshot.isComplete && (
              <div className="protocol-outcome">
                {snapshot.state === "cancelled" ? (
                  <ShieldAlert size={18} aria-hidden="true" />
                ) : (
                  <FileCheck2 size={18} aria-hidden="true" />
                )}
                <div>
                  <strong>Scenario outcome</strong>
                  <p>{scenario.outcome}</p>
                </div>
              </div>
            )}
          </aside>
        </div>

        <div className="protocol-journal">
          <div className="protocol-panel-label">Immutable event journal</div>
          <ol>
            {scenario.events.map((event, index) => {
              const isApplied = index < snapshot.appliedSteps;
              const isNext = index === snapshot.appliedSteps;

              return (
                <li data-applied={isApplied} data-next={isNext} key={event.id}>
                  <span className="protocol-journal-sequence">
                    {isApplied ? <Check size={15} aria-hidden="true" /> : event.sequence}
                  </span>
                  <div className="protocol-journal-time">
                    <strong>{event.at}</strong>
                    <span>{event.actor}</span>
                  </div>
                  <div className="protocol-journal-event">
                    <strong>{event.action}</strong>
                    <p>{event.detail}</p>
                    <small>{event.evidence}</small>
                  </div>
                  <div className="protocol-journal-transition">
                    <span>{protocolStateLabel(event.from)}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                    <strong>{protocolStateLabel(event.to)}</strong>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="protocol-capabilities" id="capabilities">
        <div className="protocol-desk-heading">
          <div>
            <span className="protocol-section-number">02</span>
            <p className="protocol-overline">Status sheet</p>
            <h2>What this lab is—and is not</h2>
          </div>
          <p>
            The distinction is part of the interface. Capability labels describe the code
            that exists today, not an imagined production system.
          </p>
        </div>

        <div className="protocol-status-grid">
          <article>
            <span className="protocol-status-tab protocol-status-built">Implemented</span>
            <CircleDot size={24} aria-hidden="true" />
            <h3>Deterministic replay core</h3>
            <ul>
              <li>Three versioned scenario fixtures</li>
              <li>Validated state transitions</li>
              <li>Forward, backward, reset, and timed replay</li>
              <li>Focused tests with no external service</li>
            </ul>
          </article>

          <article>
            <span className="protocol-status-tab protocol-status-simulated">Simulated</span>
            <FlaskConical size={24} aria-hidden="true" />
            <h3>Exchange participants</h3>
            <ul>
              <li>Counterparties and reference prices</li>
              <li>Inspection evidence and documents</li>
              <li>Clearing receipts and cancellation marks</li>
              <li>Every represented settlement outcome</li>
            </ul>
          </article>

          <article>
            <span className="protocol-status-tab protocol-status-roadmap">Roadmap</span>
            <FileCheck2 size={24} aria-hidden="true" />
            <h3>Production infrastructure</h3>
            <ul>
              <li>Persistent append-only journal</li>
              <li>Authenticated organizations and roles</li>
              <li>Signed inspection attestations</li>
              <li>Payment, title, logistics, or chain adapters</li>
            </ul>
          </article>
        </div>
      </section>

      <footer className="protocol-footer">
        <div>
          <span className="protocol-wordmark-mark">B/</span>
          <p>
            <strong>Barter Protocol Lab</strong>
            Open-source mechanics for inspectable commodity exchange workflows.
          </p>
        </div>
        <p>
          Synthetic data · No financial service · No custody · No blockchain transaction
        </p>
      </footer>
    </main>
  );
}
