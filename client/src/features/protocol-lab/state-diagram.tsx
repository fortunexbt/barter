import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  protocolStateLabel,
  protocolTransitions,
  terminalStates,
  type ProtocolScenario,
  type ProtocolState,
  type ReplaySnapshot,
} from "./demo-engine";
import { stateTone } from "./state-tone";

// Grid position of each state: column left to right, row 0 (detour) to 2 (stop lane).
const grid: Record<ProtocolState, readonly [number, number]> = {
  listed: [0, 1],
  matched: [1, 1],
  countered: [2, 0],
  inspection_hold: [2, 2],
  terms_recorded: [3, 1],
  inspection_passed: [4, 0],
  settled: [5, 1],
  cancelled: [5, 2],
};

const states = Object.keys(grid) as ProtocolState[];
const NODE_RADIUS = 8;
const PAD_X = 40;
// Room for the two-line labels that sit above the detour row.
const PAD_TOP = 44;
const ROW_HEIGHT = 66;
const LABEL_SPACE = 44;
// Keep in sync with .diagram min-height so the page does not shift on first measure.
const HEIGHT = PAD_TOP + ROW_HEIGHT * 2 + LABEL_SPACE;
const HEAD_MS = 420;

const transitionKey = (from: ProtocolState, to: ProtocolState) => `${from}>${to}`;

function useWidth<T extends Element>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

interface StateDiagramProps {
  scenario: ProtocolScenario;
  snapshot: ReplaySnapshot;
  reducedMotion: boolean;
  onJump: (step: number) => void;
}

export function StateDiagram({ scenario, snapshot, reducedMotion, onJump }: StateDiagramProps) {
  const [frameRef, width] = useWidth<HTMLDivElement>();
  const columnWidth = (width - PAD_X * 2) / 5;
  const position = (state: ProtocolState) => {
    const [column, row] = grid[state];
    return { x: PAD_X + column * columnWidth, y: PAD_TOP + row * ROW_HEIGHT };
  };

  const pathStates = [scenario.initialState, ...scenario.events.map((event) => event.to)];
  const pathKeys = scenario.events.map((event) => transitionKey(event.from, event.to));
  const tone = stateTone[snapshot.state];
  const current = position(snapshot.state);

  const headRef = useRef<SVGCircleElement>(null);
  const previous = useRef({ scenarioId: snapshot.scenarioId, step: snapshot.appliedSteps });

  // Slide the head along the edge it just crossed. Jumps, scenario switches and
  // reduced motion put it straight on the current node.
  useLayoutEffect(() => {
    const last = previous.current;
    previous.current = { scenarioId: snapshot.scenarioId, step: snapshot.appliedSteps };
    const delta = snapshot.appliedSteps - last.step;
    const head = headRef.current;

    if (!head) return undefined;

    if (reducedMotion || last.scenarioId !== snapshot.scenarioId || Math.abs(delta) !== 1) {
      // A cancelled slide may have left the head mid-edge.
      head.setAttribute("cx", String(current.x));
      head.setAttribute("cy", String(current.y));
      return undefined;
    }

    const event = scenario.events[Math.min(snapshot.appliedSteps, last.step)];
    const a = position(event.from);
    const b = position(event.to);
    const started = performance.now();
    let frame = 0;

    const place = (progress: number) => {
      const t = delta > 0 ? progress : 1 - progress;
      const u = 1 - t;
      const mid = (a.x + b.x) / 2;
      const x = u ** 3 * a.x + 3 * u * u * t * mid + 3 * u * t * t * mid + t ** 3 * b.x;
      const y = u ** 3 * a.y + 3 * u * u * t * a.y + 3 * u * t * t * b.y + t ** 3 * b.y;
      head.setAttribute("cx", String(x));
      head.setAttribute("cy", String(y));
    };

    const tick = (now: number) => {
      const progress = easeInOut(Math.min(1, (now - started) / HEAD_MS));
      place(progress);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    place(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [snapshot.scenarioId, snapshot.appliedSteps]);

  const jumpKey = (step: number) => (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onJump(step);
    }
  };

  return (
    <div className="diagram" ref={frameRef}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="group"
          aria-label={`State machine. Current state: ${protocolStateLabel(snapshot.state)}.`}
        >
          <path
            className="diagram-start"
            d={`M ${PAD_X - 30} ${position("listed").y} H ${PAD_X - NODE_RADIUS - 4}`}
          />
          <path
            className="diagram-start"
            d={`M ${PAD_X - NODE_RADIUS - 9} ${position("listed").y - 4} L ${PAD_X - NODE_RADIUS - 3} ${position("listed").y} L ${PAD_X - NODE_RADIUS - 9} ${position("listed").y + 4}`}
          />

          {protocolTransitions.map(({ from, to }) => {
            const key = transitionKey(from, to);
            const a = position(from);
            const b = position(to);
            const x1 = a.x + NODE_RADIUS + 2;
            const x2 = b.x - NODE_RADIUS - 3;
            const mid = (x1 + x2) / 2;
            const index = pathKeys.indexOf(key);
            const status =
              index === -1
                ? "off"
                : index < snapshot.appliedSteps
                  ? "done"
                  : index === snapshot.appliedSteps
                    ? "next"
                    : "ahead";

            return (
              <g className="diagram-edge" data-status={status} key={key}>
                <path
                  d={`M ${x1} ${a.y} C ${mid} ${a.y}, ${mid} ${b.y}, ${x2} ${b.y}`}
                />
                <path className="diagram-arrow" d={`M ${x2 - 6} ${b.y - 4} L ${x2} ${b.y} L ${x2 - 6} ${b.y + 4}`} />
              </g>
            );
          })}

          {states.map((state) => {
            const { x, y } = position(state);
            const step = pathStates.indexOf(state);
            const onPath = step !== -1;
            const reached = onPath && step <= snapshot.appliedSteps;
            const isCurrent = state === snapshot.state;
            const [first, second] = protocolStateLabel(state).split(" ");
            const interactive = onPath && !isCurrent;

            return (
              <g
                className="diagram-node"
                data-path={onPath}
                data-reached={reached}
                data-current={isCurrent}
                data-tone={isCurrent ? tone : undefined}
                key={state}
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-label={interactive ? `Jump to ${protocolStateLabel(state)}, step ${step}` : undefined}
                onClick={interactive ? () => onJump(step) : undefined}
                onKeyDown={interactive ? jumpKey(step) : undefined}
              >
                <circle className="diagram-hit" cx={x} cy={y} r={22} />
                <circle className="diagram-focus" cx={x} cy={y} r={NODE_RADIUS + 7} />
                <circle className="diagram-dot" cx={x} cy={y} r={NODE_RADIUS} />
                {terminalStates.includes(state) && (
                  <circle className="diagram-terminal" cx={x} cy={y} r={NODE_RADIUS + 4} />
                )}
                {/* Detour-row labels sit above the node so the edges leaving it stay clear. */}
                <text x={x} y={grid[state][1] === 0 ? y - NODE_RADIUS - (second ? 22 : 8) : y + NODE_RADIUS + 17}>
                  <tspan x={x}>{first}</tspan>
                  {second && (
                    <tspan x={x} dy="1.1em">
                      {second}
                    </tspan>
                  )}
                </text>
              </g>
            );
          })}

          <circle
            ref={headRef}
            className="diagram-head"
            data-tone={tone}
            cx={current.x}
            cy={current.y}
            r={NODE_RADIUS - 3}
            aria-hidden="true"
          />
        </svg>
      )}
    </div>
  );
}
