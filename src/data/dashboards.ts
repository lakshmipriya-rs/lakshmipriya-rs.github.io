/*
 * Dashboard previews: how the platforms in the case studies look to the
 * people who use them. Headline numbers match the case studies; everything
 * else (hostnames, customers, time series) is illustrative and fictional.
 */
import type { Status } from "../lib/status";

/* ── Fleet (Hosted Environment Navigator) ─────────────────────────────── */
const fleetCells = (() => {
  const special: Record<number, { status: Status; note: string }> = {
    37: { status: "critical", note: "unreachable · WinRM timeout" },
    211: { status: "critical", note: "unreachable · powered off" },
    58: { status: "warning", note: "cert expires in 12 days" },
    140: { status: "warning", note: "cert expires in 21 days" },
    302: { status: "warning", note: "disk 91% used" },
    377: { status: "warning", note: "cert expires in 9 days" },
    419: { status: "serious", note: "drift · 1 critical key" },
  };
  return Array.from({ length: 453 }, (_, i) => {
    const product = i < 337 ? "fa" : "m5";
    const n = product === "fa" ? i + 1 : i - 336;
    const id = `${product}-app-${String(n).padStart(3, "0")}`;
    const hit = special[i];
    return hit
      ? { id, status: hit.status, note: hit.note }
      : { id, status: "good" as Status, note: "healthy" };
  });
})();

/* ── Synthetic monitoring ─────────────────────────────────────────────── */
const CUSTOMERS = [
  "Northwind Transit",
  "Contoso County",
  "Fabrikam Utilities",
  "Tailspin Airport",
  "Woodgrove City",
  "Adatum Schools",
  "Litware Fleet",
  "Proseware DOT",
];
const strips = CUSTOMERS.map((name, row) => {
  const slots: Status[] = Array.from({ length: 48 }, () => "good");
  if (row === 0) slots.splice(46, 2, "critical", "critical"); // failing now
  if (row === 1) slots.splice(19, 1, "warning");
  if (row === 4) slots.splice(38, 2, "warning", "critical"); // maintenance window
  if (row === 6) slots.splice(31, 1, "warning");
  return { name, slots };
});
const slotLabel = (i: number) => {
  const minutes = i * 30 + 6 * 60 + 30; // window starts 06:30 yesterday
  const h = Math.floor(minutes / 60) % 24;
  return `${String(h).padStart(2, "0")}:${minutes % 60 === 0 ? "00" : "30"}`;
};
const loginSeconds = [
  3.4, 3.3, 3.5, 3.6, 3.9, 4.2, 4.4, 4.1, 3.8, 3.7, 3.6, 3.5, 3.4, 3.3, 3.2,
  3.1, 3.2, 3.4, 3.3, 7.8, 4.6, 3.6, 3.4, 3.5,
];

/* ── Provisioning ─────────────────────────────────────────────────────── */
const stageDurations: [string, number][] = [
  ["Validate request", 40],
  ["Order in ManageIQ", 35],
  ["Host placement", 85],
  ["IP / DNS reserve", 55],
  ["Clone + customize", 725],
  ["DNS verify", 110],
  ["Verify VM", 130],
];
const stages = stageDurations.map(([name, duration], i) => ({
  name,
  duration,
  start: stageDurations.slice(0, i).reduce((sum, [, d]) => sum + d, 0),
}));

/* ── Drift ─────────────────────────────────────────────────────────────── */
const driftDays = [
  ...[22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((d) => `Oct ${d}`),
  ...[1, 2, 3, 4].map((d) => `Nov ${d}`),
];
const driftValues = [
  [0, 0, 1, 0],
  [0, 1, 0, 1],
  [0, 0, 0, 0],
  [0, 0, 2, 0],
  [0, 0, 0, 1],
  [1, 0, 1, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 2, 1, 0],
  [0, 0, 0, 1],
  [0, 0, 1, 0],
  [0, 0, 0, 0],
  [0, 0, 1, 1],
  [1, 0, 2, 0],
];

/* ── Cloud cost (EKS) ─────────────────────────────────────────────────── */
const costMonths = [
  { label: "Sep", value: 7000 },
  { label: "Oct", value: 7100 },
  { label: "Nov", value: 6600 },
  { label: "Dec", value: 5800 },
  { label: "Jan", value: 5100 },
  { label: "Feb", value: 4700 },
  { label: "Mar", value: 4500 },
];
const replicas = [
  3, 3, 3, 3, 3, 4, 6, 9, 12, 14, 14, 13, 12, 12, 13, 14, 12, 10, 8, 6, 5, 4, 3,
  3,
].map((value, h) => ({ label: `${String(h).padStart(2, "0")}:00`, value }));

export const dashboards = {
  fleet: {
    cells: fleetCells,
    products: [
      { label: "FA-EAM", value: 337 },
      { label: "M5", value: 116 },
    ],
    jobs: [
      {
        job: "discovery · fleet refresh",
        target: "453 servers",
        took: "6m 12s",
        label: "ok",
        status: "good" as Status,
      },
      {
        job: "drift · metro-shared",
        target: "13 servers",
        took: "41s",
        label: "drift",
        status: "serious" as Status,
      },
      {
        job: "cert scan",
        target: "453 servers",
        took: "2m 03s",
        label: "ok",
        status: "good" as Status,
      },
      {
        job: "discovery · host",
        target: "fa-app-038",
        took: "30s",
        label: "failed",
        status: "critical" as Status,
      },
    ],
  },
  synthetic: { strips, slotLabel, loginSeconds },
  provisioning: {
    stages,
    weeks: [
      "Sep 15",
      "Sep 22",
      "Sep 29",
      "Oct 6",
      "Oct 13",
      "Oct 20",
      "Oct 27",
      "Nov 3",
    ],
    runs: [
      [1, 0],
      [2, 0],
      [1, 1],
      [3, 0],
      [2, 0],
      [3, 0],
      [2, 0],
      [2, 0],
    ],
    recent: [
      {
        id: "#1042",
        vm: "app-prd-21",
        env: "prod",
        host: "esx-prod-07",
        took: "19m 40s",
        label: "succeeded",
        status: "good" as Status,
      },
      {
        id: "#1041",
        vm: "app-tst-14",
        env: "test",
        host: "esx-dev-03",
        took: "dns-verify",
        label: "failed",
        status: "critical" as Status,
      },
      {
        id: "#1040",
        vm: "app-tst-13",
        env: "test",
        host: "esx-dev-01",
        took: "18m 55s",
        label: "succeeded",
        status: "good" as Status,
      },
      {
        id: "#1039",
        vm: "rpt-prd-04",
        env: "prod",
        host: "esx-fac-02",
        took: "21m 10s",
        label: "succeeded",
        status: "good" as Status,
      },
    ],
  },
  drift: {
    days: driftDays,
    values: driftValues,
    files: [
      { label: "web.config", value: 9 },
      { label: "saml.config", value: 4 },
      { label: "Gateway/Web.config", value: 3 },
      { label: "appsettings.json", value: 2 },
    ],
  },
  cost: { months: costMonths, replicas },
};
