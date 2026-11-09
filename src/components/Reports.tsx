import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowUpRight, FileText } from "lucide-react";
import { content } from "../data/content";
import {
  reports,
  type AlertReport,
  type DriftReport,
  type LogReport,
  type Report,
  type Severity,
} from "../data/reports";
import { SectionHeader } from "./SectionHeader";
import { TermBar } from "./Terminal";

const lineTone = (line: string) => {
  if (/^\s*[═─=-]{6,}/.test(line)) return "log-rule";
  if (/✓/.test(line)) return "log-ok";
  if (/FAILURE|Error:|stderr:|NXDOMAIN|WARNING/.test(line)) return "log-err";
  if (/^\s*#\d/.test(line)) return "log-head";
  if (/^\s*- /.test(line)) return "log-muted";
  if (/^\s*\$ /.test(line)) return "log-cmd";
  return undefined;
};

function LogView({ report }: { report: LogReport }) {
  return (
    <div className="report-log-wrap">
      <p className="report-command">
        <span className="prompt-sign" aria-hidden="true">
          ${" "}
        </span>
        {report.command}
      </p>
      {/* Scrollable region: must be keyboard-focusable to scroll (axe scrollable-region-focusable). */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <pre className="report-log" tabIndex={0} aria-label={report.title}>
        {report.body.split("\n").map((line, index) => (
          <span className={lineTone(line)} key={index}>
            {line}
            {"\n"}
          </span>
        ))}
      </pre>
    </div>
  );
}

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

function SeverityChip({ level }: { level: Severity }) {
  return <span className={`sev sev-${level}`}>{level}</span>;
}

function DriftView({ report }: { report: DriftReport }) {
  const drifted = report.drifted.length;
  const counts = SEVERITIES.map((level) => ({
    level,
    count: report.drifted.filter((file) => file.severity === level).length,
  }));
  return (
    <div className="drift">
      <dl className="drift-stats">
        <div>
          <dt>cluster</dt>
          <dd>{report.cluster}</dd>
        </div>
        <div>
          <dt>checked</dt>
          <dd>{report.checkedAt}</dd>
        </div>
        <div>
          <dt>servers</dt>
          <dd>{report.servers.length}</dd>
        </div>
        <div>
          <dt>files in sync</dt>
          <dd>
            {report.filesTracked - drifted} / {report.filesTracked}
          </dd>
        </div>
        <div>
          <dt>drifted</dt>
          <dd className="drift-bad">{drifted}</dd>
        </div>
      </dl>

      <p className="drift-legend">
        {counts.map(({ level, count }) => (
          <span key={level}>
            <SeverityChip level={level} /> {count}
          </span>
        ))}
        <span className="drift-baseline">baseline: majority wins</span>
      </p>

      <div className="drift-matrix-wrap">
        <table className="drift-matrix">
          <caption className="sr-only">
            Drifted files by server. A mark means the server differs from the
            baseline.
          </caption>
          <thead>
            <tr>
              <th scope="col">file</th>
              {report.servers.map((server) => (
                <th scope="col" key={server}>
                  {server}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.drifted.map((file) => (
              <tr key={file.path}>
                <th scope="row">{file.path}</th>
                {report.servers.map((server) => {
                  const differs = file.servers.includes(server);
                  return (
                    <td
                      key={server}
                      className={
                        differs ? `cell-drift cell-${file.severity}` : "cell-ok"
                      }
                    >
                      {differs ? "≠" : "·"}
                      <span className="sr-only">
                        {differs ? " differs" : " matches baseline"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="drift-files">
        {report.drifted.map((file) =>
          file.keys.map((item) => (
            <li className="drift-key" key={file.path + item.key}>
              <p className="drift-key-head">
                <SeverityChip level={item.severity} />
                <span className="drift-key-name">{item.key}</span>
                <span className="drift-key-where">
                  {file.servers.join(", ")}
                </span>
              </p>
              <pre className="drift-diff">
                <span className="diff-base">
                  {"baseline".padEnd(9)} {item.baseline}
                </span>
                {"\n"}
                <span className="diff-drift">
                  {file.servers.join(",").padEnd(9)} {item.drifted}
                </span>
              </pre>
              <p className="drift-impact">{item.impact}</p>
            </li>
          )),
        )}
      </ul>
    </div>
  );
}

function AlertView({ report }: { report: AlertReport }) {
  const { email } = report;
  return (
    <div className="alert-grid">
      <figure className="mail">
        <figcaption className="mail-head">
          <span>
            <b>Subject</b> {email.subject}
          </span>
          <span>
            <b>From</b> {email.from}
          </span>
          <span>
            <b>To</b> {email.to}
          </span>
        </figcaption>
        <div className="mail-body">
          <p className="mail-banner">⚠ {email.headline}</p>
          <p className="mail-lead">{email.lead}</p>
          <table className="mail-table">
            <caption className="sr-only">Failure details</caption>
            <tbody>
              {email.fields.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <span className="mail-button" aria-hidden="true">
            View Pipeline Run
          </span>
        </div>
      </figure>
      <figure className="pd">
        <figcaption className="pd-head">
          POST events.pagerduty.com/v2/enqueue
        </figcaption>
        {/* Scrollable region: must be keyboard-focusable to scroll (axe scrollable-region-focusable). */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <pre className="report-log" tabIndex={0} aria-label="PagerDuty event">
          {report.pagerduty}
        </pre>
      </figure>
    </div>
  );
}

function ReportBody({ report }: { report: Report }) {
  if (report.kind === "drift") return <DriftView report={report} />;
  if (report.kind === "alert") return <AlertView report={report} />;
  return <LogView report={report} />;
}

export function Reports() {
  const [activeId, setActiveId] = useState(reports[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = reports.find((report) => report.id === activeId) ?? reports[0];
  const source = content.cases.find((item) => item.id === active.caseId);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const keys: Record<string, number> = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowUp: -1,
      ArrowLeft: -1,
    };
    let next: number | null = null;
    if (event.key in keys)
      next = (index + keys[event.key] + reports.length) % reports.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = reports.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActiveId(reports[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="section" id="reports" aria-labelledby="reports-title">
      <div className="container">
        <SectionHeader
          command="ls ./reports"
          title="Sample Reports"
          titleId="reports-title"
        >
          What these systems actually print. These are the real output formats,
          re-rendered with synthetic data: every host, IP, customer, and run ID
          here is fictional.
        </SectionHeader>

        <div className="term reports-term">
          <TermBar
            title={
              <>
                <span className="term-title-dim">~/reports/</span>
                {active.file}
              </>
            }
            meta={<span className="synthetic-tag">synthetic data</span>}
          />
          <div className="reports-layout">
            <div
              className="report-tabs"
              role="tablist"
              aria-label="Reports"
              aria-orientation="vertical"
            >
              {reports.map((report, index) => {
                const selected = report.id === active.id;
                return (
                  <button
                    key={report.id}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`report-tab-${report.id}`}
                    aria-selected={selected}
                    aria-controls="report-panel"
                    tabIndex={selected ? 0 : -1}
                    className="report-tab"
                    onClick={() => setActiveId(report.id)}
                    onKeyDown={(event) => onKeyDown(event, index)}
                  >
                    <FileText size={14} aria-hidden="true" />
                    <span className="report-tab-file">{report.file}</span>
                  </button>
                );
              })}
            </div>

            <div
              className="report-panel"
              role="tabpanel"
              id="report-panel"
              aria-labelledby={`report-tab-${active.id}`}
            >
              <header className="report-head">
                <h3 className="report-title">{active.title}</h3>
                <p className="report-summary">{active.summary}</p>
                {source ? (
                  <a className="report-source" href={`#case-${source.id}`}>
                    from case {source.index} · {source.title}
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                ) : null}
              </header>
              <ReportBody report={active} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
