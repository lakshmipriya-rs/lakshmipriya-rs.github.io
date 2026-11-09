export interface Principle {
  id: string;
  title: string;
  belief: string;
  practice: string;
  caseId: string;
}

/** Engineering principles, each backed by something shipped in a case study. */
export const principles: Principle[] = [
  {
    id: "explain-failure",
    title: "Make the failure explain itself",
    belief:
      "A failed job should tell the on-call engineer where it broke and what to check first, without anyone opening the code.",
    practice:
      "Failed provisioning runs print the stage, the failing task, selected error fields, and a first-check hint, and never the raw result, so secrets stay out of the logs.",
    caseId: "vm-provisioning",
  },
  {
    id: "prove-parity",
    title: "Prove it before you switch it",
    belief:
      "Rewrites fail at cutover, not in code review. Make the old system the test oracle.",
    practice:
      "Navigator v2 replaced nothing until it matched v1 byte for byte on recorded traffic: 99/99 topology URLs and 9,960 drift responses.",
    caseId: "navigator-v2",
  },
  {
    id: "fleet-normal",
    title: "Let the fleet define normal",
    belief:
      "Hand-maintained golden copies go stale. The servers themselves already agree on what correct looks like.",
    practice:
      "Drift detection uses a majority-wins baseline, then rates each differing key by impact, so a changed SSO endpoint pages and a timeout tweak doesn't.",
    caseId: "config-drift",
  },
  {
    id: "config-onboarding",
    title: "Onboarding is a config change",
    belief:
      "If adding the 170th customer takes as much work as the first, the system doesn't scale. The people running it do the scaling.",
    practice:
      "A new customer in synthetic testing is a generated YAML file and pipeline. Credentials come from Key Vault at run time, never from pipeline config.",
    caseId: "synthetic-testing",
  },
  {
    id: "guardrails",
    title: "Guardrails before speed",
    belief:
      "Going from 7 days to 20 minutes only helps if the fast path is also the safe one.",
    practice:
      "Placement skips hosts that are in maintenance, short on capacity, or missing the network, and production pipelines are approval-gated.",
    caseId: "vm-provisioning",
  },
  {
    id: "enforce-architecture",
    title: "Enforce architecture in CI, not in docs",
    belief: "A diagram doesn't stop the next shortcut. A failing build does.",
    practice:
      "A boundary test breaks the build when one product package imports another, which keeps FA-EAM and M5 independent on a shared platform.",
    caseId: "navigator-v2",
  },
];
