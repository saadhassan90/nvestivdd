import type {
  NorthStarAnswer,
  RenderPayload,
  VerdictTier,
} from "@/types/renderContract";
import { flagshipPayload } from "./flagshipPayload";

/**
 * Deterministic per-fund payload generator. Clones the flagship demo payload,
 * swaps identity fields and narrative tokens to fit the target fund, and varies
 * verdict/scores via a simple seeded hash so each fund tells a slightly
 * different story while staying contract-shaped.
 */

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function pickTier(score: number): { tier: VerdictTier; answer: NorthStarAnswer; statement: (n: string) => string } {
  if (score >= 80)
    return {
      tier: "advance",
      answer: "ADVANCE",
      statement: (n) =>
        `Take the meeting — ${n} clears the composite bar across the rubric with no critical findings; advance to full diligence.`,
    };
  if (score >= 65)
    return {
      tier: "advance_with_diligence",
      answer: "CONDITIONAL",
      statement: (n) =>
        `Worth the hour — ${n} clears the bar but two findings need GP answers before further work; meeting agenda below isolates the asks.`,
    };
  if (score >= 50)
    return {
      tier: "defer",
      answer: "CONDITIONAL",
      statement: (n) =>
        `Defer — material gaps in ${n}'s submission outweigh strengths today; re-evaluate once data-room asks are returned.`,
    };
  return {
    tier: "decline",
    answer: "DECLINE",
    statement: (n) =>
      `Decline — ${n}'s composite sits below the institutional floor with hard issues across multiple dimensions. Pass.`,
  };
}

function rewrite(text: string, name: string): string {
  const short = name.split(/\s+/).slice(0, 2).join(" ");
  return text
    .replace(/Harborline Capital Partners Fund II/g, name)
    .replace(/Harborline Capital Management LLC/g, `${short} Management LLC`)
    .replace(/Harborline Capital/g, short)
    .replace(/Harborline Fund II/g, name)
    .replace(/Harborline Fund I/g, `${short} Fund I`)
    .replace(/Harborline/g, short);
}

function rewriteDeep<T>(node: T, name: string): T {
  if (typeof node === "string") return rewrite(node, name) as unknown as T;
  if (Array.isArray(node)) return node.map((n) => rewriteDeep(n, name)) as unknown as T;
  if (node && typeof node === "object") {
    const out: any = {};
    for (const k of Object.keys(node as any)) out[k] = rewriteDeep((node as any)[k], name);
    return out;
  }
  return node;
}

export interface BuildOpts {
  projectId: string;
  fundName: string;
  assetClass?: string;
  forceComposite?: number;
}

export function buildPayload({
  projectId,
  fundName,
  assetClass = "Private Equity — Lower-Mid-Market Buyout",
  forceComposite,
}: BuildOpts): RenderPayload {
  const seed = hash(projectId + fundName);
  const composite = forceComposite ?? 35 + (seed % 60);
  const { tier, answer, statement } = pickTier(composite);

  const base = rewriteDeep(clone(flagshipPayload), fundName) as RenderPayload;

  const modBumps = [-4, 6, -2, 9, -7];
  base.verdict.modules = base.verdict.modules.map((m, i) => ({
    ...m,
    score: Math.max(15, Math.min(95, composite + modBumps[i] + ((seed >> i) & 7) - 3)),
  }));
  base.verdict.composite_score = composite;
  base.verdict.tier = tier;
  base.verdict.north_star = { answer, statement: statement(fundName) };

  if (answer === "DECLINE" && base.flags.items.every((f) => f.severity !== "CRITICAL")) {
    base.flags.items[0].severity = "CRITICAL";
  }

  base.meta = {
    ...base.meta,
    project_id: projectId,
    run_id: `gen-${seed.toString(36)}`,
    asset_class: assetClass,
    generated_at: new Date().toISOString(),
  };
  const setField = (key: string, value: string) => {
    const f = base.factsheet.fields.find((x) => x.key === key);
    if (f) f.value = value;
  };
  setField("fund_name", fundName);
  setField("gp", `${fundName.split(/\s+/).slice(0, 2).join(" ")} Management LLC`);

  return base;
}