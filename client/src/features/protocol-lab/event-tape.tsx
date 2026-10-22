import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  protocolStateLabel,
  replayScenario,
  type ProtocolScenario,
} from "./demo-engine";

// Each frame is punched with the journal mark after that entry: 8 hex digits,
// one column per digit, four data holes per column around a feed-hole row.
const DATA_ROWS = [3, 2, 1, 0] as const;

function Holes({ mark, punched }: { mark: string; punched: boolean }) {
  return (
    <span className="tape-holes" aria-hidden="true">
      {[...mark].map((digit, column) => {
        const bits = Number.parseInt(digit, 16);
        return (
          <span className="tape-column" key={column}>
            {DATA_ROWS.map((bit) => (
              <i key={bit} data-on={punched && (bits & (1 << bit)) !== 0} />
            ))}
          </span>
        );
      })}
    </span>
  );
}

interface EventTapeProps {
  scenario: ProtocolScenario;
  step: number;
  onScrub: (step: number) => void;
}

export function EventTape({ scenario, step, onScrub }: EventTapeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const last = scenario.events.length;
  const frames = Array.from({ length: last + 1 }, (_, index) => ({
    index,
    event: index === 0 ? null : scenario.events[index - 1],
    mark: replayScenario(scenario, index).fingerprint,
  }));
  const current = replayScenario(scenario, step);

  const stepAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(last, Math.floor(ratio * (last + 1))));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    onScrub(stepAt(event.clientX));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !event.isPrimary) return;
    const next = stepAt(event.clientX);
    if (next !== step) onScrub(next);
  };

  const endDrag = () => setDragging(false);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowLeft: step - 1,
      ArrowDown: step - 1,
      ArrowRight: step + 1,
      ArrowUp: step + 1,
      Home: 0,
      End: last,
      PageDown: 0,
      PageUp: last,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    onScrub(Math.max(0, Math.min(last, moves[event.key])));
  };

  const valueText =
    step === 0
      ? `Start, ${protocolStateLabel(scenario.initialState)}`
      : `Entry ${step} of ${last}: ${scenario.events[step - 1].action}, now ${protocolStateLabel(current.state)}`;

  return (
    <div
      className="tape"
      data-dragging={dragging}
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Event tape"
      aria-valuemin={0}
      aria-valuemax={last}
      aria-valuenow={step}
      aria-valuetext={valueText}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      style={{ gridTemplateColumns: `repeat(${last + 1}, minmax(0, 1fr))` }}
    >
      {frames.map(({ index, event, mark }) => (
        <div className="tape-frame" data-punched={index <= step} data-current={index === step} key={index}>
          <Holes mark={mark} punched={index <= step} />
          <span className="tape-type">
            <b>{String(index).padStart(2, "0")}</b>
            <span>{event ? event.at.replace(" UTC", "") : "start"}</span>
          </span>
          <span className="tape-action">{event ? event.action : "Lots listed"}</span>
        </div>
      ))}
      <span
        className="tape-head"
        aria-hidden="true"
        style={{ width: `${100 / (last + 1)}%`, transform: `translateX(${step * 100}%)` }}
      />
    </div>
  );
}
