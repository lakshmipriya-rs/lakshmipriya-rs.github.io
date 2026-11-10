import { useEffect, useState } from "react";
import { ArrowRight, Download, Send } from "lucide-react";
import { content } from "../data/content";
import { prefersReducedMotion } from "../lib/motion";
import { HeroPipeline } from "./HeroPipeline";
import { Prompt, TermBar } from "./Terminal";

const COMMAND = "whoami";
const TYPE_MS = 70;
const base = import.meta.env.BASE_URL;

function useTypedCommand() {
  const reduced = prefersReducedMotion();
  const [typed, setTyped] = useState(reduced ? COMMAND : "");
  const [ready, setReady] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    let index = 0;
    let revealTimer = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(COMMAND.slice(0, index));
      if (index >= COMMAND.length) {
        window.clearInterval(timer);
        revealTimer = window.setTimeout(() => setReady(true), 180);
      }
    }, TYPE_MS);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(revealTimer);
    };
  }, [reduced]);

  return { typed, ready };
}

function CountUp({ value, start }: { value: string; start: boolean }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const match = /^([~$]?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(value);
    if (!start || !match || prefersReducedMotion()) return;
    const [, prefix, digits, suffix] = match;
    const grouped = digits.includes(",");
    const target = Number.parseFloat(digits.replace(/,/g, ""));
    const decimals = digits.split(".")[1]?.length ?? 0;
    const format = (n: number) =>
      grouped
        ? n.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : n.toFixed(decimals);
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 1100, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(`${prefix}${format(target * eased)}${suffix}`);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, value]);

  return (
    <>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{value}</span>
    </>
  );
}

export function Hero() {
  const { typed, ready } = useTypedCommand();
  const reveal = ready ? "reveal revealed" : "reveal";
  const status = [
    ["status", `"open to work"`],
    ["focus", `[${content.focus.map((item) => `"${item}"`).join(", ")}]`],
    ["location", `"${content.location}"`],
    ["relocation", "true"],
  ];

  return (
    <section className="hero" id="hero" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="term hero-term">
          <TermBar title="lakshmipriya@ops: ~ — zsh" meta="120×40" />
          <div className="term-body">
            <Prompt
              command={
                <>
                  {typed}
                  {ready ? null : <i className="caret" />}
                </>
              }
            />

            <div className={`hero-copy ${reveal}`}>
              <p className="hero-name">
                {content.name}
                <span className="hero-role">{content.focus.join(" · ")}</span>
              </p>

              <Prompt command="cat about.md" />
              <h1 className="hero-title" id="hero-title">
                Automation <br />
                that runs reliably.
              </h1>
              <p className="hero-lead">{content.headline}</p>

              <Prompt command="./status --json" />
              <pre className="json" aria-hidden="true">
                <span className="json-punct">{"{"}</span>
                {status.map(([key, value], index) => (
                  <span className="json-line" key={key}>
                    {"  "}
                    <span className="json-key">"{key}"</span>
                    <span className="json-punct">: </span>
                    <span
                      className={value === "true" ? "json-bool" : "json-str"}
                    >
                      {value}
                    </span>
                    {index < status.length - 1 ? (
                      <span className="json-punct">,</span>
                    ) : null}
                  </span>
                ))}
                <span className="json-punct">{"}"}</span>
              </pre>
              <dl className="sr-only">
                <dt>Status</dt>
                <dd>Open to work</dd>
                <dt>Focus</dt>
                <dd>{content.focus.join(", ")}</dd>
                <dt>Location</dt>
                <dd>{content.location}, open to relocation</dd>
              </dl>

              <div className="hero-actions">
                <a className="button button-primary" href="#cases">
                  View case studies <ArrowRight size={15} aria-hidden="true" />
                </a>
                <a
                  className="button button-secondary"
                  href={`${base}${content.resume}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={15} aria-hidden="true" /> Download resume
                </a>
                <a className="button button-ghost" href="#contact">
                  <Send size={14} aria-hidden="true" /> Contact me
                </a>
              </div>
              <p className="prompt prompt-idle" aria-hidden="true">
                <span className="prompt-user">lakshmipriya@ops</span>
                <span className="prompt-path">:~</span>
                <span className="prompt-sign">$</span> <i className="caret" />
              </p>
            </div>
          </div>
        </div>

        <HeroPipeline />
      </div>

      <div className={`container ${reveal}`}>
        <div className="term highlights-term">
          <TermBar title="~/metrics — ./impact --summary" meta="production" />
          <ul className="highlights" aria-label="Headline results">
            {content.highlights.map((item) => (
              <li key={item.label}>
                <a className="highlight" href={`#case-${item.caseId}`}>
                  <strong className="highlight-value">
                    <CountUp value={item.value} start={ready} />
                  </strong>
                  <span className="highlight-label">
                    <span className="comment-mark" aria-hidden="true">
                      #{" "}
                    </span>
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
