import { useState, type ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  Cloud,
  GitCompare,
  Lock,
  Server,
  Workflow,
} from "lucide-react";
import { content } from "../data/content";
import { dashboards as d } from "../data/dashboards";
import {
  BarList,
  Gantt,
  Kpi,
  LineChart,
  StackedColumns,
  StatusGrid,
  StatusPill,
  StatusStrips,
} from "./charts";
import { SectionHeader } from "./SectionHeader";

function Panel({
  title,
  meta,
  wide,
  children,
}: {
  title: string;
  meta?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={wide ? "dash-panel dash-panel-wide" : "dash-panel"}>
      <header className="dash-panel-head">
        <h4 className="dash-panel-title">{title}</h4>
        {meta ? <span className="dash-panel-meta">{meta}</span> : null}
      </header>
      {children}
    </section>
  );
}

const usd = (v: number) => `$${(v / 1000).toFixed(1)}k`;

interface Dashboard {
  id: string;
  tab: string;
  icon: ReactNode;
  app: string;
  url: string;
  nav: string[];
  activeNav?: string;
  heading: string;
  range: string;
  caseId: string;
  takeaways: string[];
  render: () => ReactNode;
}

const DASHBOARDS: Dashboard[] = [
  {
    id: "fleet",
    tab: "Fleet overview",
    icon: <Server size={14} aria-hidden="true" />,
    app: "Navigator",
    url: "navigator.corp.example/fleet",
    nav: ["Fleet", "Drift", "Jobs", "Certs", "API"],
    heading: "Fleet overview",
    range: "live",
    caseId: "environment-navigator",
    takeaways: [
      "Every hosted server on one screen. Each square is a server; hover one to see why it isn't green.",
      "Discovery, drift, and cert scans run as background jobs and report back here.",
      "Ops starts from this page instead of RDP-ing into boxes one by one.",
    ],
    render: () => (
      <>
        <div className="kpi-row">
          <Kpi label="servers" value="453" sub="FA-EAM 337 · M5 116" />
          <Kpi label="reachable" value="451" status="good" sub="99.6%" />
          <Kpi
            label="needs attention"
            value="5"
            status="warning"
            sub="see grid"
          />
          <Kpi label="unreachable" value="2" status="critical" sub="paged" />
        </div>
        <div className="dash-panels">
          <Panel title="Fleet health" meta="1 square = 1 server" wide>
            <StatusGrid title="Fleet health by server" cells={d.fleet.cells} />
          </Panel>
          <Panel title="Servers by product">
            <BarList title="Servers by product" rows={d.fleet.products} />
          </Panel>
          <Panel title="Recent jobs" meta="Asynq">
            <ul className="dash-list">
              {d.fleet.jobs.map((job) => (
                <li key={job.job}>
                  <span>
                    {job.job}
                    <span className="dash-dim"> · {job.target}</span>
                  </span>
                  <span className="dash-list-end">
                    <span className="dash-dim">{job.took}</span>
                    <StatusPill status={job.status} text={job.label} />
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </>
    ),
  },
  {
    id: "synthetic",
    tab: "Synthetic monitoring",
    icon: <Activity size={14} aria-hidden="true" />,
    app: "Synthetic",
    url: "dev.azure.com/…/synthetic-dashboard",
    nav: ["Overview", "Customers", "Runs", "Alerts", "Onboard"],
    heading: "Customer health · last 24 hours",
    range: "every 10 min",
    caseId: "synthetic-testing",
    takeaways: [
      "Each row is a customer and each cell is a 30-minute window of real logins run by a robot.",
      "Red means a customer can't log in, and we know before they call.",
      "The 01:30 spike is the maintenance window, which is exactly when these checks matter most.",
    ],
    render: () => (
      <>
        <div className="kpi-row">
          <Kpi label="customers monitored" value="169" sub="YAML-onboarded" />
          <Kpi label="checks · 24h" value="24,336" sub="169 × 144" />
          <Kpi label="pass rate" value="99.6%" status="good" sub="24h" />
          <Kpi
            label="failing now"
            value="1"
            status="critical"
            sub="PagerDuty open"
          />
        </div>
        <div className="dash-panels">
          <Panel
            title="Login checks by customer"
            meta="sample of 8 · 30-min windows"
            wide
          >
            <StatusStrips
              title="Login check status by customer"
              rows={d.synthetic.strips}
              slotLabel={d.synthetic.slotLabel}
            />
          </Panel>
          <Panel title="Median login time" meta="seconds · hourly" wide>
            <LineChart
              title="Median login time, last 24 hours"
              points={d.synthetic.loginSeconds.map((value, i) => ({
                label: d.synthetic.slotLabel(i * 2),
                value,
              }))}
              format={(v) => `${v.toFixed(1)}s`}
            />
          </Panel>
        </div>
      </>
    ),
  },
  {
    id: "provisioning",
    tab: "VM provisioning",
    icon: <Workflow size={14} aria-hidden="true" />,
    app: "Azure DevOps",
    url: "dev.azure.com/…/provision-vm/1042",
    nav: ["Pipelines", "Runs", "Approvals", "Environments", "Library"],
    activeNav: "Runs",
    heading: "Run #1042 · app-prd-21",
    range: "90 days",
    caseId: "vm-provisioning",
    takeaways: [
      "One Azure DevOps pipeline run becomes a ready, domain-joined Windows VM in about 20 minutes after approval. It used to take 7 days.",
      "The timeline shows where the time goes. Cloning and guest customization are most of it, and that part is VMware's work, not people's.",
      "Failed runs stop with a clear failure report (see Sample Reports), not a mystery.",
    ],
    render: () => (
      <>
        <div className="kpi-row">
          <Kpi label="median run" value="19m 40s" sub="was 7 days" />
          <Kpi label="VMs · 90d" value="17" sub="prod + test" />
          <Kpi label="success rate" value="94%" status="good" sub="16 / 17" />
          <Kpi label="manual steps" value="0" sub="approval only" />
        </div>
        <div className="dash-panels">
          <Panel
            title="Stage timeline"
            meta="run #1042 · after approval · min:sec"
            wide
          >
            <Gantt
              title="Stage durations for run 1042"
              stages={d.provisioning.stages}
            />
          </Panel>
          <Panel title="Runs per week">
            <StackedColumns
              title="Provisioning runs per week"
              categories={d.provisioning.weeks}
              series={[
                { key: "ok", label: "succeeded", tone: "good" },
                { key: "fail", label: "failed", tone: "critical" },
              ]}
              values={d.provisioning.runs}
              height={160}
            />
          </Panel>
          <Panel title="Recent runs">
            <ul className="dash-list">
              {d.provisioning.recent.map((run) => (
                <li key={run.id}>
                  <span>
                    {run.id} {run.vm}
                    <span className="dash-dim"> · {run.env}</span>
                  </span>
                  <span className="dash-list-end">
                    <span className="dash-dim">{run.took}</span>
                    <StatusPill status={run.status} text={run.label} />
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </>
    ),
  },
  {
    id: "drift",
    tab: "Config drift",
    icon: <GitCompare size={14} aria-hidden="true" />,
    app: "Navigator",
    url: "navigator.corp.example/drift/metro-shared",
    nav: ["Fleet", "Drift", "Jobs", "Certs", "API"],
    activeNav: "Drift",
    heading: "Config drift · metro-shared (prod)",
    range: "14 days",
    caseId: "config-drift",
    takeaways: [
      "Every 15 minutes, each server's config files are compared with what the rest of the cluster agrees on.",
      "Findings are rated by impact. A broken SSO endpoint is critical; a timeout tweak is low.",
      "The most-drifted files show where manual changes keep sneaking in.",
    ],
    render: () => (
      <>
        <div className="kpi-row">
          <Kpi label="files tracked" value="144" sub="13 servers" />
          <Kpi label="in sync" value="141" status="good" sub="97.9%" />
          <Kpi
            label="drifted now"
            value="3"
            status="critical"
            sub="1 critical"
          />
          <Kpi label="last check" value="4 min ago" sub="every 15 min" />
        </div>
        <div className="dash-panels">
          <Panel title="New drift findings per day" meta="by severity" wide>
            <StackedColumns
              title="New drift findings per day by severity"
              categories={d.drift.days}
              series={[
                { key: "critical", label: "critical", tone: "critical" },
                { key: "high", label: "high", tone: "serious" },
                { key: "medium", label: "medium", tone: "warning" },
                { key: "low", label: "low", tone: "1" },
              ]}
              values={d.drift.values}
            />
          </Panel>
          <Panel title="Most-drifted files" meta="30 days">
            <BarList title="Most-drifted files" rows={d.drift.files} />
          </Panel>
          <Panel title="Open findings">
            <ul className="dash-list">
              <li>
                <span>
                  saml.config<span className="dash-dim"> · app04</span>
                </span>
                <StatusPill status="critical" text="critical" />
              </li>
              <li>
                <span>
                  web.config<span className="dash-dim"> · app02</span>
                </span>
                <StatusPill status="warning" text="medium" />
              </li>
              <li>
                <span>
                  Gateway/Web.config<span className="dash-dim"> · app05</span>
                </span>
                <StatusPill status="warning" text="medium" />
              </li>
            </ul>
          </Panel>
        </div>
      </>
    ),
  },
  {
    id: "cost",
    tab: "Cloud cost & scaling",
    icon: <Cloud size={14} aria-hidden="true" />,
    app: "Grafana",
    url: "grafana.corp.example/d/eks-platform",
    nav: ["Platform", "Cost", "Logs", "Anomalies", "Alerts"],
    heading: "EKS platform · cost & scaling",
    range: "7 months",
    caseId: "epilogue",
    takeaways: [
      "Monthly AWS spend fell from $7.0k to $4.5k after cutting redundant CloudWatch ingestion and unused metrics.",
      "Autoscaling (HPA) follows the daily traffic curve, so capacity is paid for only when it's used.",
      "Same visibility, less spend: monitoring got leaner, not blinder.",
    ],
    render: () => (
      <>
        <div className="kpi-row">
          <Kpi label="AWS / month" value="$4.5k" sub="from $7.0k" />
          <Kpi label="cost" value="−35%" status="good" sub="7 months" />
          <Kpi
            label="downtime"
            value="−45%"
            status="good"
            sub="anomaly alerts"
          />
          <Kpi label="image size" value="−35%" sub="Docker rebuild" />
        </div>
        <div className="dash-panels">
          <Panel title="Monthly AWS spend" meta="USD" wide>
            <LineChart
              title="Monthly AWS spend"
              points={d.cost.months}
              format={usd}
            />
          </Panel>
          <Panel
            title="Pod replicas (HPA) · one weekday"
            meta="api deployment"
            wide
          >
            <LineChart
              title="Pod replicas over one weekday"
              points={d.cost.replicas}
              format={(v) => `${Math.round(v)}`}
              height={150}
            />
          </Panel>
        </div>
      </>
    ),
  },
];

export function Dashboards() {
  const [activeId, setActiveId] = useState(DASHBOARDS[0].id);
  const active = DASHBOARDS.find((x) => x.id === activeId) ?? DASHBOARDS[0];
  const source = content.cases.find((c) => c.id === active.caseId);

  return (
    <section
      className="section"
      id="dashboards"
      aria-labelledby="dashboards-title"
    >
      <div className="container">
        <SectionHeader
          command="open ./dashboards"
          title="Platform Dashboards"
          titleId="dashboards-title"
        >
          What the platforms look like to the people using them. Headline
          numbers match the case studies; hostnames, customers, and time series
          are illustrative.
        </SectionHeader>

        <div className="dash-tabs" role="tablist" aria-label="Dashboards">
          {DASHBOARDS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`dash-tab-${item.id}`}
              aria-selected={item.id === active.id}
              aria-controls="dash-panel"
              className="dash-tab"
              onClick={() => setActiveId(item.id)}
            >
              {item.icon}
              {item.tab}
            </button>
          ))}
        </div>

        <div className="dash-layout">
          <figure
            className="dash"
            role="tabpanel"
            id="dash-panel"
            aria-labelledby={`dash-tab-${active.id}`}
          >
            <div className="dash-chrome">
              <span className="term-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="dash-url">
                <Lock size={11} aria-hidden="true" />
                {active.url}
              </span>
              <span className="synthetic-tag">illustrative data</span>
            </div>
            <div className="dash-app">
              <nav className="dash-nav" aria-hidden="true">
                <span className="dash-brand">{active.app}</span>
                {active.nav.map((item) => (
                  <span
                    key={item}
                    className={
                      item === (active.activeNav ?? active.nav[0])
                        ? "is-active"
                        : undefined
                    }
                  >
                    {item}
                  </span>
                ))}
              </nav>
              <div className="dash-main">
                <header className="dash-head">
                  <h3 className="dash-title">{active.heading}</h3>
                  <span className="dash-range">{active.range}</span>
                </header>
                {active.render()}
              </div>
            </div>
          </figure>

          <aside className="dash-notes" aria-label="What you're looking at">
            <p className="dash-notes-title">
              <span className="comment-mark" aria-hidden="true">
                #{" "}
              </span>
              what you're looking at
            </p>
            <ol>
              {active.takeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            {source ? (
              <a className="report-source" href={`#case-${source.id}`}>
                how it works · case {source.index}
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
