/*
 * Sample reports: real output formats from systems in the case studies,
 * re-rendered with synthetic data. Every hostname, IP (RFC 5737 192.0.2.0/24),
 * customer, and run ID below is fictional.
 */

export type Severity = "critical" | "high" | "medium" | "low";

interface ReportBase {
  id: string;
  file: string;
  title: string;
  caseId: string;
  summary: string;
}

export interface LogReport extends ReportBase {
  kind: "log";
  command: string;
  body: string;
}

export interface DriftKey {
  key: string;
  baseline: string;
  drifted: string;
  severity: Severity;
  impact: string;
}

export interface DriftFile {
  path: string;
  servers: string[];
  severity: Severity;
  keys: DriftKey[];
}

export interface DriftReport extends ReportBase {
  kind: "drift";
  cluster: string;
  checkedAt: string;
  servers: string[];
  filesTracked: number;
  drifted: DriftFile[];
}

export interface AlertReport extends ReportBase {
  kind: "alert";
  email: {
    subject: string;
    from: string;
    to: string;
    headline: string;
    lead: string;
    fields: [string, string][];
  };
  pagerduty: string;
}

export type Report = LogReport | DriftReport | AlertReport;

const placement = `══════════════════════════════════════════════════════════════
 HYPERVISOR PLACEMENT RECOMMENDATION
 vCenter: vcenter.corp.example | DC: DC-East
 Environment: PROD
 Scope: Production clusters (PROD, Facilities)

 Weights: Memory 50% | CPU 30% | Storage 20%
 Filters: >= 20% mem free (tolerance 5 pts), >= 250 GB datastore free, network VLAN-210-App

 Scanned: 18 | Eligible: 11
 Excluded: 7
══════════════════════════════════════════════════════════════
 #1  esx-prod-07 (PROD)
      Score:    71.58  (mem 68.2 | cpu 68.2 | storage 85.1)
      CPU:      48 cores
      Memory:   698.4 GB free / 1024.0 GB (68.2% free)
      Storage:  1821.1 GB free (largest accessible datastore)
 ──────────────────────────────────────────────────────────────
 #2  esx-prod-12 (PROD)
      Score:    69.20  (mem 61.5 | cpu 61.5 | storage 100.0)
      CPU:      40 cores
      Memory:   472.3 GB free / 768.0 GB (61.5% free)
      Storage:  2140.0 GB free (largest accessible datastore)
 ──────────────────────────────────────────────────────────────
 #3  esx-fac-02 (Facilities)
      Score:    60.80  (mem 57.9 | cpu 57.9 | storage 72.4)
      CPU:      48 cores
      Memory:   592.9 GB free / 1024.0 GB (57.9% free)
      Storage:  1549.4 GB free (largest accessible datastore)
 ──────────────────────────────────────────────────────────────
 Excluded hosts:
 - esx-prod-02 (PROD): maintenance mode
 - esx-prod-11 (PROD): memory below 20% free (tolerance 5 points)
 - esx-fac-03 (Facilities): missing required network: VLAN-210-App
 - … 4 more
══════════════════════════════════════════════════════════════
 ✓ RECOMMENDED: esx-prod-07 (score: 71.58)
══════════════════════════════════════════════════════════════`;

const failure = `================ PROVISIONING FAILURE ================
VM:             app-tst-14
Stage:          dns-verify
Failed task:    Verify forward and reverse DNS records
Module:         ansible.builtin.command
Error:          forward lookup for app-tst-14.corp.example returned NXDOMAIN after 10 retries
Return code:    1
HTTP status:    n/a
stderr:         ** server can't find app-tst-14.corp.example: NXDOMAIN
stdout:
------------------------ context -------------------
Hypervisor:     esx-dev-03
Network profile: test-app
Allocated IP:   192.0.2.47 (reserved in IPAM: True)
FQDN:           app-tst-14.corp.example
First check:    VMware Tools registers DNS from inside the guest. Confirm the
                guest finished customization and joined the domain, then rerun
                from the dns-verify stage.
======================================================`;

const parity = `fleet grid · FA-EAM             388 / 388 rows     identical   ✓
fleet grid · M5                 208 / 208 rows     identical   ✓
topology API (20 routes)         99 / 99 URLs      byte-identical  ✓
/api/customers · /api/summaries                    byte-identical  ✓
drift XML parsers                90 corpus cases   match       ✓
drift XML parsers (fuzzed)   16,000 inputs         match       ✓
drift summary + file detail   9,960 responses      byte-identical  ✓
  └─ replayed from 186 stored snapshots
M5 save path (replay)           729 / 729 rows     identical   ✓
M5 save path (altered scans)    556 changed · 13 retired → identical  ✓
──────────────────────────────────────────────────────────────
grid perf: filter + sort + page 1,000 rows        0.4 ms
/jobs page server time                           < 3 ms
──────────────────────────────────────────────────────────────
✓ parity holds — phase eligible for dual-run`;

const pagerduty = `{
  "routing_key": "••••••••••••••••",
  "event_action": "trigger",
  "dedup_key": "synthetic/northwind-transit/login",
  "payload": {
    "summary": "[Synthetic] LOGIN FAILED — Northwind Transit (prod)",
    "source": "ado-agent-synthetic-04",
    "severity": "critical",
    "component": "login",
    "custom_details": {
      "customer": "Northwind Transit",
      "test_type": "Login",
      "pipeline_run": "Synthetic-Northwind_20261104.7",
      "failed_step": "Wait for dashboard after SSO redirect (30s timeout)"
    }
  },
  "links": [{ "href": "https://dev.azure.com/…/_build/results?buildId=…",
              "text": "View pipeline run" }]
}`;

export const reports: Report[] = [
  {
    id: "placement",
    kind: "log",
    file: "placement-report.log",
    title: "Hypervisor placement report",
    caseId: "vm-provisioning",
    summary:
      "Printed on every provisioning run: which ESXi hosts were scanned, why some were excluded, and how the winner was scored.",
    command: "ansible-playbook find_best_hypervisor.yml -e vm_environment=prod",
    body: placement,
  },
  {
    id: "failure",
    kind: "log",
    file: "provisioning-failure.log",
    title: "Provisioning failure report",
    caseId: "vm-provisioning",
    summary:
      "When a run fails, a rescue block prints the stage, the failing task, selected error fields, and what to check first. It never dumps full results, so module secrets can't leak into job logs.",
    command:
      "ansible-playbook provision_fa_vsphere.yml  # rescue: report_failure",
    body: failure,
  },
  {
    id: "drift",
    kind: "drift",
    file: "config-drift.html",
    title: "Configuration drift report",
    caseId: "config-drift",
    summary:
      "A 15-minute check across a shared app cluster. The baseline is whatever most servers agree on; only the files that differ get parsed key by key and rated.",
    cluster: "metro-shared (prod)",
    checkedAt: "2026-11-04 09:45 UTC",
    servers: ["app01", "app02", "app03", "app04", "app05", "app06"],
    filesTracked: 24,
    drifted: [
      {
        path: String.raw`C:\App\web\saml.config`,
        servers: ["app04"],
        severity: "critical",
        keys: [
          {
            key: "AssertionConsumerService@Location",
            baseline: "https://app.corp.example/saml/acs",
            drifted: "https://app-old.corp.example/saml/acs",
            severity: "critical",
            impact:
              "SSO on this node redirects to a retired endpoint, so users routed here can't sign in.",
          },
        ],
      },
      {
        path: String.raw`C:\App\web\web.config`,
        servers: ["app02"],
        severity: "medium",
        keys: [
          {
            key: "system.web/compilation@debug",
            baseline: "false",
            drifted: "true",
            severity: "medium",
            impact:
              "Debug compilation in production slows the node down and can expose stack traces.",
          },
        ],
      },
      {
        path: String.raw`C:\App\Gateway\Web.config`,
        servers: ["app05"],
        severity: "medium",
        keys: [
          {
            key: "system.web/httpRuntime@maxRequestLength",
            baseline: "51200",
            drifted: "4096",
            severity: "medium",
            impact:
              "Large uploads fail only when the load balancer routes them to this node, which looks like a random error.",
          },
        ],
      },
    ],
  },
  {
    id: "alert",
    kind: "alert",
    file: "synthetic-alert.eml",
    title: "Synthetic test failure alert",
    caseId: "synthetic-testing",
    summary:
      "One failed check produces two signals: an HTML email for the team and a de-duplicated PagerDuty event for on-call, both linking straight to the pipeline run.",
    email: {
      subject: "[Synthetic] LOGIN FAILED — Northwind Transit (prod)",
      from: "synthetic-testing@corp.example",
      to: "hosting-oncall@corp.example",
      headline: "Synthetic Test Failure",
      lead: "The Login test for Northwind Transit has failed.",
      fields: [
        ["Customer", "Northwind Transit"],
        ["Test Type", "Login Test"],
        ["Pipeline", "Synthetic-Northwind_20261104.7"],
        ["Branch", "main"],
        ["Agent", "ado-agent-synthetic-04"],
        ["Detected At", "2026-11-04 06:10:42 EST"],
      ],
    },
    pagerduty,
  },
  {
    id: "parity",
    kind: "log",
    file: "v2-parity-report.txt",
    title: "v1 → v2 parity report",
    caseId: "navigator-v2",
    summary:
      "The evidence behind every Navigator v2 cutover: v2 replays recorded v1 traffic and must match it byte for byte before a product moves.",
    command: "navctl parity fa && navctl parity m5 && navctl parity drift",
    body: parity,
  },
];
