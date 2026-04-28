import { describe, it, expect } from "vitest";
import { computeComposite, autoDeferGate, DIMENSION_WEIGHTS } from "@/lib/composite";
import { getVerdict } from "@/lib/verdict-utils";

/**
 * PRD v2.0 §8.1 — sparse-input QA.
 *
 * Three mandatory scenarios that must produce credible, well-typed verdicts
 * without fabricating data:
 *   1. One-page tear sheet         — only Investment Thesis + Market Reality
 *      have any signal; Team / Track Record / Economics are Insufficient Data.
 *   2. Unregistered fund           — no Form ADV/D, Reg & Ops would Fail. Hard
 *      Floor would force Decline regardless of composite.
 *   3. First-time emerging manager — no Track Record at all (excluded from
 *      composite per §3.5 first_time_fund variant) but other dimensions
 *      may be strong.
 *
 * Plus the canonical PRD worked example: 4 dims at 7.0 + 1 ID = 70/100,
 * not 56/100. This is the renormalization invariant.
 */

describe("PRD §7.3 — composite renormalization", () => {
  it("PRD worked example: 4 sections at 7.0 + 1 ID renormalizes to 70/100, not 56", () => {
    const result = computeComposite([
      { module_key: "investment_thesis", score: 7 },
      { module_key: "market_reality", score: 7 },
      { module_key: "team", score: 7 },
      { module_key: "track_record", score: 7 },
      { module_key: "economics", score: null }, // ID
    ]);
    expect(result.composite).toBe(70);
    expect(result.used).toBe(4);
    expect(result.excluded).toEqual(["economics"]);
    expect(result.renormalized).toBe(true);
  });

  it("all-ID inputs return null composite (not 0)", () => {
    const result = computeComposite([
      { module_key: "investment_thesis", score: null },
      { module_key: "market_reality", score: 0 },
      { module_key: "team", score: null },
      { module_key: "track_record", score: null },
      { module_key: "economics", score: null },
    ]);
    expect(result.composite).toBeNull();
    expect(result.used).toBe(0);
    expect(result.excluded.length).toBe(5);
  });

  it("ignores non-composite dimensions like regulatory_ops", () => {
    const result = computeComposite([
      { module_key: "investment_thesis", score: 8 },
      { module_key: "market_reality", score: 8 },
      { module_key: "team", score: 8 },
      { module_key: "track_record", score: 8 },
      { module_key: "economics", score: 8 },
      { module_key: "regulatory_ops", score: 5 }, // must be ignored
    ]);
    expect(result.composite).toBe(80);
    expect(result.used).toBe(5);
  });

  it("dimension weights still sum to 100", () => {
    const sum = Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });
});

describe("PRD §8.1 — Scenario 1: one-page tear sheet (sparse)", () => {
  // Only Thesis + Market have any signal; the rest are ID.
  const sparse = computeComposite([
    { module_key: "investment_thesis", score: 6 },
    { module_key: "market_reality", score: 7 },
    { module_key: "team", score: null },
    { module_key: "track_record", score: null },
    { module_key: "economics", score: null },
  ]);

  it("renormalizes over the available 35 weight units (15 + 20)", () => {
    // weighted = (6/10*100*15) + (7/10*100*20) = 900 + 1400 = 2300
    // weightTotal = 35; composite = round(2300/35) = 66
    expect(sparse.composite).toBe(66);
    expect(sparse.used).toBe(2);
    expect(sparse.excluded).toEqual(["team", "track_record", "economics"]);
    expect(sparse.renormalized).toBe(true);
  });

  it("auto-Defer fires when completeness <30% even if score is decent", () => {
    // Tear sheet → very low completeness (e.g. 20%)
    const verdict = getVerdict(sparse.composite!, "complete", {
      completenessPct: 20,
      hardFloorTriggered: false,
    });
    expect(verdict).toBe("defer");

    // autoDeferGate predicate matches
    expect(autoDeferGate({ completenessPct: 20 })).toBe("defer");
  });

  it("at completeness >=30%, normal score ladder applies (66 → conditional_advance)", () => {
    const verdict = getVerdict(sparse.composite!, "complete", {
      completenessPct: 35,
    });
    expect(verdict).toBe("conditional_advance");
  });
});

describe("PRD §8.1 — Scenario 2: unregistered fund (no Form ADV/D)", () => {
  // Composite could be anything — but Hard Floor forces Decline.
  const composite = computeComposite([
    { module_key: "investment_thesis", score: 8 },
    { module_key: "market_reality", score: 8 },
    { module_key: "team", score: 8 },
    { module_key: "track_record", score: 8 },
    { module_key: "economics", score: 8 },
  ]);

  it("composite computes normally to 80", () => {
    expect(composite.composite).toBe(80);
  });

  it("Hard Floor short-circuits to Decline regardless of strong composite", () => {
    const verdict = getVerdict(composite.composite!, "complete", {
      hardFloorTriggered: true,
      completenessPct: 80,
    });
    expect(verdict).toBe("decline");

    // autoDeferGate also returns decline when Hard Floor fired
    expect(autoDeferGate({ hardFloorTriggered: true, completenessPct: 80 }))
      .toBe("decline");
  });

  it("Hard Floor wins over auto-Defer (Decline beats Defer)", () => {
    const verdict = getVerdict(45, "complete", {
      hardFloorTriggered: true,
      completenessPct: 10, // would normally trigger Defer
    });
    expect(verdict).toBe("decline");
  });
});

describe("PRD §8.1 — Scenario 3: first-time emerging manager (no Track Record)", () => {
  // first_time_fund variant: track_record is excluded; remaining 4 dims at 7.0
  // should renormalize to 70/100 over 80 weight units (15+20+25+20).
  const firstTime = computeComposite([
    { module_key: "investment_thesis", score: 7 },
    { module_key: "market_reality", score: 7 },
    { module_key: "team", score: 7 },
    { module_key: "track_record", score: null }, // ID — first-time fund
    { module_key: "economics", score: 7 },
  ]);

  it("renormalizes over 80 weight units (15+20+25+20)", () => {
    // weighted = 7/10*100*(15+20+25+20) = 70 * 80 = 5600
    // /80 = 70
    expect(firstTime.composite).toBe(70);
    expect(firstTime.used).toBe(4);
    expect(firstTime.excluded).toEqual(["track_record"]);
  });

  it("with reasonable completeness (>=30%) and no Hard Floor → conditional_advance", () => {
    const verdict = getVerdict(firstTime.composite!, "complete", {
      hardFloorTriggered: false,
      completenessPct: 55,
    });
    expect(verdict).toBe("conditional_advance");
  });

  it("composite of 70 sits in conditional_advance band (60–74)", () => {
    expect(getVerdict(70, "complete")).toBe("conditional_advance");
    expect(getVerdict(74, "complete")).toBe("conditional_advance");
    expect(getVerdict(75, "complete")).toBe("advance");
  });
});

describe("PRD §1.1 — verdict ladder boundary tests", () => {
  it("score 90 → advance", () => expect(getVerdict(90, "complete")).toBe("advance"));
  it("score 75 → advance", () => expect(getVerdict(75, "complete")).toBe("advance"));
  it("score 74 → conditional_advance", () => expect(getVerdict(74, "complete")).toBe("conditional_advance"));
  it("score 60 → conditional_advance", () => expect(getVerdict(60, "complete")).toBe("conditional_advance"));
  it("score 59 → defer", () => expect(getVerdict(59, "complete")).toBe("defer"));
  it("score 40 → defer", () => expect(getVerdict(40, "complete")).toBe("defer"));
  it("score 39 → decline", () => expect(getVerdict(39, "complete")).toBe("decline"));
  it("processing status → pending", () =>
    expect(getVerdict(80, "processing")).toBe("pending"));
  it("null score → pending", () =>
    expect(getVerdict(null, "complete")).toBe("pending"));
});