import { Building2, User, Briefcase, ListChecks, MessageSquare, AlertTriangle, Users } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { FieldValueGrid } from "@/components/project/primitives/FieldValueGrid";
import { EmptyChip } from "@/components/project/primitives/EmptyChip";
import { getSectionTier, SCORE_TIER_LABELS, type ScoreTier } from "@/lib/score-utils";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

/**
 * PRD v2.0 §3.4 — Team & Manager tab (renamed from "Team", tightened).
 *
 * Layout:
 *  1. Score header (1–10 + tier)
 *  2. Sponsor entity card(s)
 *  3. team_grid with departure_flag (per PRD)
 *  4. Sub-scores (Relevant Experience 25 / Cohesion 20 / Prior Firm 20 / Bench 15 / Key Person 20)
 *  5. Service providers (governance)
 *  6. Diligence Questions (2–4)
 */

interface TeamTabProps {
  teamMembers: Tables<"team_members">[];
  serviceProviders: Tables<"service_providers">[];
  redFlags?: Tables<"red_flags">[];
  interrogatoryItems?: Tables<"interrogatory_items">[];
  gpEntityName?: string | null;
  moduleScoresData?: any[];
}

const SUB_SCORES = [
  { key: "experience", label: "Relevant Experience", weight: 25 },
  { key: "cohesion", label: "Team Cohesion", weight: 20 },
  { key: "prior_firm", label: "Prior Firm Pedigree", weight: 20 },
  { key: "bench", label: "Bench Strength", weight: 15 },
  { key: "key_person", label: "Key Person Risk", weight: 20 },
];

export function TeamTab({
  teamMembers,
  serviceProviders,
  interrogatoryItems = [],
  gpEntityName,
  moduleScoresData = [],
}: TeamTabProps) {
  const teamModule = moduleScoresData.find((m) =>
    ["team", "module_b", "manager"].some(
      (a) =>
        m.module_key?.toLowerCase().includes(a) ||
        m.module_label?.toLowerCase().includes(a),
    ),
  );
  const rawScore = teamModule?.score ?? null;
  const score10 = rawScore == null ? null : rawScore > 10 ? Math.round((rawScore / 10) * 10) / 10 : rawScore;
  const tier = getSectionTier(score10);

  const teamQs = interrogatoryItems
    .filter((q) =>
      (q.module || q.source_module || "").toLowerCase().match(/team|module_b|manager/),
    )
    .slice(0, 4);

  const keyPersons = teamMembers.filter((m) => m.is_key_person).length;

  return (
    <div className="space-y-5">
      {/* 1. Score header */}
      <BlurFade>
        <SectionCard
          title="Team & Manager"
          subtitle="Relevant experience · cohesion · prior-firm pedigree · bench · key-person risk"
          icon={<Users className="h-4 w-4" />}
          actions={<ScoreHeader score10={score10} tier={tier} />}
        >
          {teamModule?.summary_assessment ? (
            <p className="text-sm leading-relaxed text-foreground/90">{teamModule.summary_assessment}</p>
          ) : (
            <p className="text-xs italic text-muted-foreground">
              Section summary not yet synthesized at L1 — awaiting Phase 7.4 per-section synthesis.
            </p>
          )}
        </SectionCard>
      </BlurFade>

      {/* 2. Sponsor entity */}
      <BlurFade delay={0.04}>
        <SectionCard
          title="Sponsor Entity"
          subtitle="One card per GP · side-by-side for co-GP funds"
          icon={<Building2 className="h-4 w-4" />}
          empty={!gpEntityName}
          emptyMessage="No sponsor entity disclosed at L1."
        >
          {gpEntityName && (
            <div className="rounded-lg border border-border p-3 max-w-md">
              <p className="text-xs font-bold text-foreground">{gpEntityName}</p>
              <FieldValueGrid
                className="mt-2"
                columns={2}
                rows={[
                  { label: "AUM", value: null },
                  { label: "Founded", value: null },
                  { label: "Entity Type", value: null },
                  { label: "Headquarters", value: null },
                ]}
              />
            </div>
          )}
        </SectionCard>
      </BlurFade>

      {/* 3. team_grid with departure_flag */}
      <BlurFade delay={0.06}>
        <SectionCard
          title="Team Grid"
          subtitle="Principals · departure flag · key-person designation"
          icon={<User className="h-4 w-4" />}
          actions={
            keyPersons > 0 ? (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="font-bold text-foreground">{keyPersons}</span> key-person designate{keyPersons !== 1 ? "s" : ""}
              </span>
            ) : null
          }
          empty={teamMembers.length === 0}
          emptyMessage="No principals parsed at L1."
        >
          {teamMembers.length > 0 && <TeamGrid members={teamMembers} />}
        </SectionCard>
      </BlurFade>

      {/* 4. Sub-scores */}
      <BlurFade delay={0.08}>
        <SectionCard
          title="Sub-Scores"
          subtitle="5 dimensions · weights sum to 100"
          icon={<ListChecks className="h-4 w-4" />}
        >
          <SubScoresPanel sectionScore10={score10} />
        </SectionCard>
      </BlurFade>

      {/* 5. Service providers (governance) */}
      <BlurFade delay={0.1}>
        <SectionCard
          title="Service Providers"
          subtitle="Auditor · administrator · custodian · advisory board"
          icon={<Briefcase className="h-4 w-4" />}
          empty={serviceProviders.length === 0}
          emptyMessage="No service providers disclosed at L1."
        >
          {serviceProviders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {serviceProviders.map((sp) => (
                <div key={sp.id} className="rounded-md border border-border px-2.5 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {sp.provider_type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs font-medium text-foreground mt-0.5 truncate">
                    {sp.provider_name || <EmptyChip />}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </BlurFade>

      {/* 6. Diligence Questions */}
      <BlurFade delay={0.12}>
        <SectionCard
          title="Diligence Questions"
          subtitle="2–4 team-scoped questions · L1 view"
          icon={<MessageSquare className="h-4 w-4" />}
          empty={teamQs.length === 0}
          emptyMessage="No team-scoped diligence questions emitted yet."
        >
          {teamQs.length > 0 && (
            <ul className="space-y-2">
              {teamQs.map((q) => (
                <li key={q.id} className="text-xs border-l-2 border-border pl-3">
                  <p className="text-foreground font-medium leading-snug">{q.question}</p>
                  {q.rationale && (
                    <p className="text-[11px] text-muted-foreground italic mt-1 leading-snug">{q.rationale}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────── */

function ScoreHeader({ score10, tier }: { score10: number | null; tier: ScoreTier }) {
  const tierClass = (() => {
    switch (tier) {
      case "exceptional":
      case "strong": return "border-score-strong/40 text-score-strong bg-score-strong/10";
      case "adequate": return "border-score-advance/40 text-score-advance bg-score-advance/10";
      case "below_average": return "border-score-review/40 text-score-review bg-score-review/10";
      case "concerning": return "border-severity-critical/40 text-severity-critical bg-severity-critical/10";
      case "insufficient_data": return "border-dashed border-border text-muted-foreground bg-muted/30";
    }
  })();
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-baseline gap-0.5 tabular-nums">
        <span className="text-2xl font-bold text-foreground">{score10 != null ? score10.toFixed(1) : "─"}</span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", tierClass)}>
        {SCORE_TIER_LABELS[tier]}
      </span>
    </div>
  );
}

function TeamGrid({ members }: { members: Tables<"team_members">[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {members.map((m) => {
        const initials = m.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
        // Departure flag — derived heuristic until pipeline emits it explicitly (Phase 7.4)
        const departureFlag =
          m.adverse_finding_severity === "critical" ||
          /depart|left|former|exit/i.test(m.adverse_findings || "");
        return (
          <div key={m.id} className="rounded-lg border border-border p-3 relative">
            {m.is_key_person && (
              <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-foreground text-background px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                Key
              </span>
            )}
            <div className="flex items-start gap-2.5 pr-12">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{m.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{m.title || <EmptyChip />}</p>
              </div>
            </div>
            <FieldValueGrid
              className="mt-2.5"
              columns={1}
              rows={[
                { label: "Tenure", value: m.years_experience ? `${m.years_experience}y` : null },
                { label: "Education", value: m.education },
                { label: "Verification", value: m.verification_status },
              ]}
            />
            {departureFlag && (
              <div className="mt-2 flex items-center gap-1.5 rounded border border-severity-critical/30 bg-severity-critical/10 px-2 py-1">
                <AlertTriangle className="h-3 w-3 text-severity-critical shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-severity-critical">
                  Departure Flag
                </span>
              </div>
            )}
            {m.adverse_findings && !departureFlag && (
              <p className="text-[11px] text-severity-elevated mt-2 leading-snug">{m.adverse_findings}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SubScoresPanel({ sectionScore10 }: { sectionScore10: number | null }) {
  return (
    <div className="space-y-2">
      {SUB_SCORES.map((s) => (
        <div key={s.key} className="grid grid-cols-[1fr_60px_60px_80px] items-center gap-3 text-xs py-1.5 border-b border-border/30 last:border-0">
          <span className="text-foreground font-medium truncate">{s.label}</span>
          <span className="text-right tabular-nums text-muted-foreground">{s.weight}%</span>
          <span className="text-right tabular-nums text-muted-foreground">─</span>
          <span className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
            {SCORE_TIER_LABELS["insufficient_data"]}
          </span>
        </div>
      ))}
      <p className="text-[10px] italic text-muted-foreground pt-2">
        Sub-score breakdown lands in Phase 4.3 (storage) + Phase 7.4 (synthesis).
        Section score above ({sectionScore10 != null ? sectionScore10.toFixed(1) : "—"}/10) reflects the rolled-up dimension.
      </p>
    </div>
  );
}
