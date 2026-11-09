import { content, type CaseStudy } from "../data/content";
import { CaseFlow } from "./CaseFlow";
import { SectionHeader } from "./SectionHeader";
import { TermBar } from "./Terminal";

const SUMMARY_FIELDS: {
  key: "problem" | "result" | "impact" | "future";
  label: string;
}[] = [
  { key: "problem", label: "problem" },
  { key: "result", label: "result" },
  { key: "impact", label: "impact" },
  { key: "future", label: "future_implementations" },
];

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function CaseStudyCard({ item }: { item: CaseStudy }) {
  const titleId = `case-${item.id}-title`;
  return (
    <article
      className="term case-card"
      id={`case-${item.id}`}
      aria-labelledby={titleId}
    >
      <TermBar
        title={
          <>
            <span className="term-title-dim">~/case-studies/</span>
            {item.index}-{slug(item.title)}
          </>
        }
        meta={
          <span className={`category-chip cat-${item.category}`}>
            {item.category}
          </span>
        }
      />

      <div className="term-body case-body">
        <div className="case-head">
          <header className="case-header">
            <p className="case-meta">
              <span className="case-index">case {item.index}</span>
              <span className="case-context">{item.context}</span>
            </p>
            <h3 className="case-title" id={titleId}>
              {item.title}
            </h3>
            <p className="case-outcome">
              <span className="outcome-mark" aria-hidden="true">
                &gt;{" "}
              </span>
              {item.outcome}
            </p>
          </header>

          <table className="case-metrics">
            <caption className="sr-only">Key metrics</caption>
            <thead>
              <tr>
                <th scope="col">value</th>
                <th scope="col">metric</th>
              </tr>
            </thead>
            <tbody>
              {item.metrics.map((metric) => (
                <tr key={metric.label}>
                  <td className="case-metric-value">{metric.value}</td>
                  <td className="case-metric-label">{metric.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CaseFlow caseId={item.id} steps={item.steps} />

        <div className="case-summary">
          {SUMMARY_FIELDS.map(({ key, label }) => (
            <section className={`summary-block summary-${key}`} key={key}>
              <h4 className="summary-label">{label}:</h4>
              <p className="summary-text">{item[key]}</p>
            </section>
          ))}
        </div>

        <div className="case-stack">
          <p className="case-stack-label" id={`${item.id}-stack`}>
            stack:
          </p>
          <ul className="chip-list" aria-labelledby={`${item.id}-stack`}>
            {item.stack.map((tool) => (
              <li className="chip" key={tool}>
                {tool}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export function CaseStudies() {
  return (
    <section className="section" id="cases" aria-labelledby="cases-title">
      <div className="container">
        <SectionHeader
          command="ls -la ./case-studies"
          title="Case Studies"
          titleId="cases-title"
        >
          {content.cases.length} systems across provisioning, platform, and
          reliability engineering: the problem, how each pipeline runs step by
          step, the measured result, and what comes next.
        </SectionHeader>
        <div className="case-list">
          {content.cases.map((item) => (
            <CaseStudyCard item={item} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
