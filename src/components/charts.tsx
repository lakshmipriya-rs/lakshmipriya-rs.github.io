/*
 * Small, dependency-free chart kit for the dashboard previews.
 * Marks follow the dataviz spec: 2px lines, ~10% area wash, >=8px end dots
 * with a 2px surface ring, <=24px columns with a 4px rounded data end and a
 * 2px surface gap between stacked segments, hairline recessive grid, and a
 * hover tooltip on every plotted mark. Text uses text tokens, never series
 * colour. Every chart has a screen-reader table.
 */
import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { STATUS_META, type Status } from "../lib/status";

function useWidth<T extends HTMLElement>(fallback = 560) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(220, Math.round(entry.contentRect.width))),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceTicks(max: number, count = 4) {
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ??
    magnitude * 10;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

/** Rect with a rounded data end (top) and a square baseline. */
function columnPath(x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

interface TipState {
  x: number;
  y: number;
  content: ReactNode;
}

function Tooltip({ tip }: { tip: TipState | null }) {
  if (!tip) return null;
  return (
    <div
      className="viz-tip"
      style={{ left: tip.x, top: tip.y }}
      role="presentation"
    >
      {tip.content}
    </div>
  );
}

function SrTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {head.map((h) => (
            <th scope="col" key={h}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Line (single series) ─────────────────────────────────────────────── */
export function LineChart({
  title,
  points,
  format,
  height = 170,
}: {
  title: string;
  points: { label: string; value: number }[];
  format: (v: number) => string;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 14, right: 56, bottom: 24, left: 44 };
  const ticks = niceTicks(Math.max(...points.map((p) => p.value)));
  const top = ticks[ticks.length - 1];
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const x = (i: number) => pad.left + (i / (points.length - 1)) * innerW;
  const y = (v: number) => pad.top + innerH - (v / top) * innerH;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`);
  const area = `${line.join("")}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const last = points[points.length - 1];
  const every = Math.ceil(points.length / Math.max(2, Math.floor(innerW / 70)));

  const onMove = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setHover(
      Math.max(
        0,
        Math.min(points.length - 1, Math.round(ratio * (points.length - 1))),
      ),
    );
  };

  return (
    <div className="viz" ref={ref}>
      <svg width={width} height={height} aria-hidden="true">
        {ticks.map((t) => (
          <g key={t}>
            <line
              className="viz-grid"
              x1={pad.left}
              x2={width - pad.right}
              y1={y(t)}
              y2={y(t)}
            />
            <text
              className="viz-tick"
              x={pad.left - 8}
              y={y(t) + 4}
              textAnchor="end"
            >
              {format(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % every === 0 || i === points.length - 1 ? (
            <text
              key={p.label}
              className="viz-tick"
              x={x(i)}
              y={height - 6}
              textAnchor="middle"
            >
              {p.label}
            </text>
          ) : null,
        )}
        <path className="viz-area" d={area} />
        <path className="viz-line" d={line.join("")} />
        <circle
          className="viz-dot"
          cx={x(points.length - 1)}
          cy={y(last.value)}
          r={4}
        />
        <text
          className="viz-endlabel"
          x={x(points.length - 1) + 9}
          y={y(last.value) + 4}
        >
          {format(last.value)}
        </text>
        {hover !== null ? (
          <g>
            <line
              className="viz-cross"
              x1={x(hover)}
              x2={x(hover)}
              y1={pad.top}
              y2={pad.top + innerH}
            />
            <circle
              className="viz-dot"
              cx={x(hover)}
              cy={y(points[hover].value)}
              r={5}
            />
          </g>
        ) : null}
        <rect
          className="viz-hit"
          x={pad.left}
          y={pad.top}
          width={innerW}
          height={innerH}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      <Tooltip
        tip={
          hover === null
            ? null
            : {
                x: x(hover),
                y: y(points[hover].value),
                content: (
                  <>
                    <span className="viz-tip-label">{points[hover].label}</span>
                    <strong>{format(points[hover].value)}</strong>
                  </>
                ),
              }
        }
      />
      <SrTable
        caption={title}
        head={["time", "value"]}
        rows={points.map((p) => [p.label, format(p.value)])}
      />
    </div>
  );
}

/* ── Stacked columns ──────────────────────────────────────────────────── */
export interface Series {
  key: string;
  label: string;
  tone: string; // CSS class suffix: viz-fill-<tone>
}

export function StackedColumns({
  title,
  categories,
  series,
  values,
  height = 180,
}: {
  title: string;
  categories: string[];
  series: Series[];
  values: number[][]; // values[category][series]
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 12, right: 8, bottom: 24, left: 32 };
  const totals = values.map((row) => row.reduce((a, b) => a + b, 0));
  const ticks = niceTicks(Math.max(1, ...totals), 3);
  const top = ticks[ticks.length - 1];
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const band = innerW / categories.length;
  const barW = Math.min(24, band * 0.62);
  const y = (v: number) => pad.top + innerH - (v / top) * innerH;
  const every = Math.ceil(
    categories.length / Math.max(2, Math.floor(innerW / 48)),
  );

  return (
    <div className="viz" ref={ref}>
      <ul className="viz-legend">
        {series.map((s) => (
          <li key={s.key}>
            <i className={`viz-swatch viz-fill-${s.tone}`} />
            {s.label}
          </li>
        ))}
      </ul>
      <svg width={width} height={height} aria-hidden="true">
        {ticks.map((t) => (
          <g key={t}>
            <line
              className="viz-grid"
              x1={pad.left}
              x2={width - pad.right}
              y1={y(t)}
              y2={y(t)}
            />
            <text
              className="viz-tick"
              x={pad.left - 8}
              y={y(t) + 4}
              textAnchor="end"
            >
              {t}
            </text>
          </g>
        ))}
        {categories.map((cat, ci) => {
          const cx = pad.left + band * ci + band / 2;
          let acc = 0;
          const nonZero = values[ci]
            .map((v, si) => (v > 0 ? si : -1))
            .filter((si) => si >= 0);
          const topIndex = nonZero[nonZero.length - 1];
          return (
            <g key={cat}>
              {hover === ci ? (
                <rect
                  className="viz-band"
                  x={pad.left + band * ci}
                  y={pad.top}
                  width={band}
                  height={innerH}
                />
              ) : null}
              {values[ci].map((v, si) => {
                if (v <= 0) return null;
                const y0 = y(acc);
                acc += v;
                const y1 = y(acc);
                const gap = si === nonZero[0] ? 0 : 2; // surface gap between segments
                const h = Math.max(1, y0 - y1 - gap);
                const className = `viz-fill-${series[si].tone}`;
                return si === topIndex ? (
                  <path
                    key={si}
                    className={className}
                    d={columnPath(cx - barW / 2, y1, barW, h)}
                  />
                ) : (
                  <rect
                    key={si}
                    className={className}
                    x={cx - barW / 2}
                    y={y1}
                    width={barW}
                    height={h}
                  />
                );
              })}
              {ci % every === 0 ? (
                <text
                  className="viz-tick"
                  x={cx}
                  y={height - 6}
                  textAnchor="middle"
                >
                  {cat}
                </text>
              ) : null}
              <rect
                className="viz-hit"
                x={pad.left + band * ci}
                y={pad.top}
                width={band}
                height={innerH}
                onPointerEnter={() => setHover(ci)}
                onPointerLeave={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>
      <Tooltip
        tip={
          hover === null
            ? null
            : {
                x: pad.left + band * hover + band / 2,
                y: y(totals[hover]),
                content: (
                  <>
                    <span className="viz-tip-label">{categories[hover]}</span>
                    {series.map((s, si) => (
                      <span className="viz-tip-row" key={s.key}>
                        <i className={`viz-swatch viz-fill-${s.tone}`} />
                        {s.label} <strong>{values[hover][si]}</strong>
                      </span>
                    ))}
                  </>
                ),
              }
        }
      />
      <SrTable
        caption={title}
        head={["", ...series.map((s) => s.label)]}
        rows={categories.map((c, ci) => [c, ...values[ci]])}
      />
    </div>
  );
}

/* ── Horizontal bars (labelled at the tip) ────────────────────────────── */
export function BarList({
  title,
  rows,
  format = (v: number) => v.toLocaleString("en-US"),
}: {
  title: string;
  rows: { label: string; value: number }[];
  format?: (v: number) => string;
}) {
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <div className="viz">
      <ul className="barlist" aria-label={title}>
        {rows.map((row) => (
          <li key={row.label}>
            <span className="barlist-label">{row.label}</span>
            <span className="barlist-track">
              <span
                className="barlist-bar"
                style={{ width: `${(row.value / max) * 100}%` }}
              />
              <span className="barlist-value">{format(row.value)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Status legend / pill ─────────────────────────────────────────────── */
export function StatusPill({
  status,
  text,
}: {
  status: Status;
  text?: string;
}) {
  return (
    <span className={`status-pill st-${status}`}>
      <span aria-hidden="true">{STATUS_META[status].icon}</span>
      {text ?? STATUS_META[status].label}
    </span>
  );
}

function StatusLegend({ statuses }: { statuses: Status[] }) {
  return (
    <ul className="viz-legend">
      {statuses.map((s) => (
        <li key={s}>
          <i className={`viz-swatch st-bg-${s}`} />
          {STATUS_META[s].label}
        </li>
      ))}
    </ul>
  );
}

/* ── Status grid (fleet heatmap) ──────────────────────────────────────── */
export function StatusGrid({
  title,
  cells,
}: {
  title: string;
  cells: { id: string; status: Status; note?: string }[];
}) {
  const [tip, setTip] = useState<TipState | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const used = (["good", "warning", "serious", "critical"] as Status[]).filter(
    (s) => cells.some((c) => c.status === s),
  );
  const show = (
    event: PointerEvent<HTMLElement>,
    cell: (typeof cells)[number],
  ) => {
    const host = ref.current?.getBoundingClientRect();
    const box = event.currentTarget.getBoundingClientRect();
    if (!host) return;
    setTip({
      x: box.left - host.left + box.width / 2,
      y: box.top - host.top,
      content: (
        <>
          <span className="viz-tip-label">{cell.id}</span>
          <StatusPill status={cell.status} text={cell.note} />
        </>
      ),
    });
  };
  return (
    <div className="viz" ref={ref}>
      <StatusLegend statuses={used} />
      <div className="status-grid" aria-hidden="true">
        {cells.map((cell) => (
          <i
            key={cell.id}
            className={`status-cell st-bg-${cell.status}`}
            onPointerEnter={(e) => show(e, cell)}
            onPointerLeave={() => setTip(null)}
          />
        ))}
      </div>
      <Tooltip tip={tip} />
      <SrTable
        caption={title}
        head={["status", "count"]}
        rows={used.map((s) => [
          STATUS_META[s].label,
          cells.filter((c) => c.status === s).length,
        ])}
      />
    </div>
  );
}

/* ── Status strips (uptime rows) ──────────────────────────────────────── */
export function StatusStrips({
  title,
  rows,
  slotLabel,
}: {
  title: string;
  rows: { name: string; slots: Status[] }[];
  slotLabel: (i: number) => string;
}) {
  const [tip, setTip] = useState<TipState | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const show = (
    event: PointerEvent<HTMLElement>,
    name: string,
    i: number,
    status: Status,
  ) => {
    const host = ref.current?.getBoundingClientRect();
    const box = event.currentTarget.getBoundingClientRect();
    if (!host) return;
    setTip({
      x: box.left - host.left + box.width / 2,
      y: box.top - host.top,
      content: (
        <>
          <span className="viz-tip-label">
            {name} · {slotLabel(i)}
          </span>
          <StatusPill status={status} />
        </>
      ),
    });
  };
  const slots = rows[0]?.slots.length ?? 0;
  return (
    <div className="viz" ref={ref}>
      <StatusLegend statuses={["good", "warning", "critical"]} />
      <ul className="strips" aria-hidden="true">
        {rows.map((row) => (
          <li key={row.name}>
            <span className="strip-name">{row.name}</span>
            <span className="strip-cells">
              {row.slots.map((status, i) => (
                <i
                  key={i}
                  className={`strip-cell st-bg-${status}`}
                  onPointerEnter={(e) => show(e, row.name, i, status)}
                  onPointerLeave={() => setTip(null)}
                />
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p className="strip-axis" aria-hidden="true">
        <span>{slotLabel(0)}</span>
        <span>{slotLabel(slots - 1)}</span>
      </p>
      <Tooltip tip={tip} />
      <SrTable
        caption={title}
        head={["customer", "healthy", "degraded", "failing"]}
        rows={rows.map((r) => [
          r.name,
          r.slots.filter((s) => s === "good").length,
          r.slots.filter((s) => s === "warning").length,
          r.slots.filter((s) => s === "critical").length,
        ])}
      />
    </div>
  );
}

/* ── Gantt (stage timeline of one run) ────────────────────────────────── */
const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export function Gantt({
  title,
  stages,
}: {
  title: string;
  stages: { name: string; start: number; duration: number }[];
}) {
  const total = Math.max(...stages.map((s) => s.start + s.duration));
  const tickStep = 300;
  const ticks = Array.from(
    { length: Math.floor(total / tickStep) + 1 },
    (_, i) => i * tickStep,
  );
  return (
    <div className="viz">
      <ul className="gantt" aria-label={title}>
        {stages.map((stage) => (
          <li key={stage.name}>
            <span className="gantt-name">{stage.name}</span>
            <span className="gantt-track">
              <span
                className="gantt-bar"
                title={`${stage.name}: ${mmss(stage.duration)}`}
                style={{
                  left: `${(stage.start / total) * 100}%`,
                  width: `${(stage.duration / total) * 100}%`,
                }}
              />
            </span>
            <span className="gantt-dur">{mmss(stage.duration)}</span>
          </li>
        ))}
      </ul>
      <p className="gantt-axis" aria-hidden="true">
        <span className="gantt-name" />
        <span className="gantt-ticks">
          {ticks.map((t) => (
            <span key={t} style={{ left: `${(t / total) * 100}%` }}>
              {t / 60}m
            </span>
          ))}
        </span>
        <span className="gantt-dur">{mmss(total)}</span>
      </p>
    </div>
  );
}

/* ── KPI tile ─────────────────────────────────────────────────────────── */
export function Kpi({
  label,
  value,
  sub,
  status,
}: {
  label: string;
  value: string;
  sub?: string;
  status?: Status;
}) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {sub || status ? (
        <span className="kpi-sub">
          {status ? <StatusPill status={status} text={sub} /> : sub}
        </span>
      ) : null}
    </div>
  );
}
