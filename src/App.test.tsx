import { act, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { CaseFlow } from "./components/CaseFlow";
import { content } from "./data/content";
import { principles } from "./data/principles";
import { reports } from "./data/reports";
import userEvent from "@testing-library/user-event";

describe("portfolio layout", () => {
  it("renders every hero pipeline log row up front so the card never changes height", () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll(".pipeline-log")).toHaveLength(
      content.heroPipeline.logs.length,
    );
  });

  it("shows case studies directly, with no filters or search", () => {
    render(<App />);
    const cases = screen.getByRole("region", { name: "Case Studies" });
    expect(within(cases).queryByRole("button", { name: /^all$/i })).toBeNull();
    expect(within(cases).queryByRole("textbox")).toBeNull();
    expect(within(cases).queryByText(/clear filter/i)).toBeNull();
  });

  it("keeps every case study open, each with its pipeline flow", () => {
    render(<App />);
    const cases = screen.getByRole("region", { name: "Case Studies" });
    expect(within(cases).getAllByRole("article")).toHaveLength(
      content.cases.length,
    );
    expect(within(cases).getAllByText(/How it works/)).toHaveLength(
      content.cases.length,
    );
    expect(cases.querySelector("[aria-expanded]")).toBeNull();
  });

  it("labels the forward-looking field future implementations instead of 'next'", () => {
    render(<App />);
    expect(screen.getAllByText("future_implementations:")).toHaveLength(
      content.cases.length,
    );
    expect(screen.queryByText(/^next$/i)).toBeNull();
  });

  it("names the tools section Skills, not capabilities", () => {
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { name: /skills/ })).toHaveAttribute(
      "href",
      "#skills",
    );
    expect(within(nav).queryByText(/capabilities/i)).toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: "Skills & Tools" }),
    ).toBeInTheDocument();
  });

  it("keeps every experience entry expanded with no toggles", () => {
    render(<App />);
    const experience = screen.getByRole("region", { name: "Experience" });
    for (const item of content.experience) {
      for (const bullet of item.bullets) {
        expect(within(experience).getByText(bullet)).toBeVisible();
      }
    }
    expect(within(experience).queryByRole("button")).toBeNull();
  });

  it("shows large email, LinkedIn, and GitHub contact links", () => {
    render(<App />);
    const contact = screen.getByRole("region", {
      name: /build the next reliable thing/i,
    });
    expect(
      within(contact).getByRole("link", { name: new RegExp(content.email) }),
    ).toHaveAttribute("href", `mailto:${content.email}`);
    expect(
      within(contact).getByRole("link", { name: /linkedin/i }),
    ).toHaveAttribute("href", content.linkedin);
    expect(
      within(contact).getByRole("link", { name: /github/i }),
    ).toHaveAttribute("href", content.github);
  });

  it("keeps the footer to status and relocation only", () => {
    render(<App />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("status: open to work | open to relocate");
    expect(footer).not.toHaveTextContent(/philadelphia|region|last deploy/i);
  });
});

describe("identity and wording", () => {
  it("uses the first name only and plain 'resume' spelling", () => {
    const { container } = render(<App />);
    expect(container).not.toHaveTextContent(/RajeshKanna/);
    expect(container).not.toHaveTextContent(/résumé/i);
    expect(
      screen.getAllByRole("link", { name: /download resume/i }).length,
    ).toBeGreaterThan(0);
  });

  it("positions the profile for DevOps, SRE, and Platform Engineering", () => {
    render(<App />);
    expect(
      screen.getByText("DevOps · SRE · Platform Engineering"),
    ).toBeInTheDocument();
  });
});

describe("case study flow", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts when scrolled into view and advances one step at a time", () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe() {
          this.callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        }
        disconnect() {}
        unobserve() {}
      },
    );
    const steps = [
      { id: "a", label: "Alpha", tools: [], summary: "first" },
      { id: "b", label: "Beta", tools: [], summary: "second" },
      { id: "c", label: "Gamma", tools: [], summary: "third" },
    ];
    render(<CaseFlow caseId="demo" steps={steps} />);
    const current = () =>
      screen
        .getAllByRole("button")
        .find((button) => button.getAttribute("aria-current") === "step");

    expect(current()).toHaveTextContent("Alpha");
    act(() => vi.advanceTimersByTime(1000)); // start delay
    act(() => vi.advanceTimersByTime(2500));
    expect(current()).toHaveTextContent("Beta");
    act(() => vi.advanceTimersByTime(2500));
    expect(current()).toHaveTextContent("Gamma");
    act(() => vi.advanceTimersByTime(2500));
    expect(screen.getByRole("button", { name: /replay/i })).toBeInTheDocument();
  });
});

describe("sample reports", () => {
  it("labels every report as synthetic data and links it to a real case study", () => {
    render(<App />);
    const section = screen.getByRole("region", { name: "Sample Reports" });
    expect(within(section).getByText("synthetic data")).toBeInTheDocument();
    expect(within(section).getAllByRole("tab")).toHaveLength(reports.length);
    const caseIds = new Set(content.cases.map((item) => item.id));
    for (const report of reports) expect(caseIds.has(report.caseId)).toBe(true);
  });

  it("switches reports by click and by arrow keys", async () => {
    const user = userEvent.setup();
    render(<App />);
    const section = screen.getByRole("region", { name: "Sample Reports" });
    const tabs = within(section).getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    await user.click(
      within(section).getByRole("tab", { name: /config-drift/ }),
    );
    expect(
      within(section).getByRole("heading", {
        name: "Configuration drift report",
      }),
    ).toBeInTheDocument();

    await user.keyboard("{ArrowDown}");
    expect(
      within(section).getByRole("tab", { name: /synthetic-alert/ }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      within(section).getByText("Synthetic test failure alert"),
    ).toBeVisible();
  });

  it("keeps sample data fictional: documentation IPs and example domains only", () => {
    const text = JSON.stringify(reports);
    const ips = text.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) ?? [];
    for (const ip of ips) expect(ip.startsWith("192.0.2.")).toBe(true);
    const hosts =
      text.match(
        /[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|local|internal)\b/gi,
      ) ?? [];
    for (const host of hosts)
      expect(host).toMatch(/(^|\.)(azure|pagerduty)\.com$/);
  });
});

describe("principles", () => {
  it("backs every principle with a link to an existing case study", () => {
    render(<App />);
    const section = screen.getByRole("region", { name: "How I Think" });
    const links = within(section).getAllByRole("link");
    expect(links).toHaveLength(principles.length);
    for (const link of links) {
      const id = link.getAttribute("href")!.replace("#", "");
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});

describe("platform dashboards", () => {
  it("marks previews as illustrative and switches dashboards by tab", async () => {
    const user = userEvent.setup();
    render(<App />);
    const section = screen.getByRole("region", { name: "Platform Dashboards" });
    expect(within(section).getByText("illustrative data")).toBeInTheDocument();
    expect(within(section).getAllByRole("tab")).toHaveLength(5);
    await user.click(
      within(section).getByRole("tab", { name: /Config drift/ }),
    );
    expect(
      within(section).getByRole("heading", {
        name: "Config drift · all monitored clusters (prod)",
      }),
    ).toBeInTheDocument();
    // every chart ships a screen-reader table
    expect(section.querySelectorAll("table.sr-only").length).toBeGreaterThan(0);
  });
});
