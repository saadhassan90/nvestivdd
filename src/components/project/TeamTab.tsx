import { Building2, User, Network, Shield, MessageSquare, Briefcase } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { FieldValueGrid } from "@/components/project/primitives/FieldValueGrid";
import { FlagLane } from "@/components/project/primitives/FlagLane";
import { EmptyChip } from "@/components/project/primitives/EmptyChip";
import type { Tables } from "@/integrations/supabase/types";

interface TeamTabProps {
  teamMembers: Tables<"team_members">[];
  serviceProviders: Tables<"service_providers">[];
  redFlags?: Tables<"red_flags">[];
  interrogatoryItems?: Tables<"interrogatory_items">[];
  gpEntityName?: string | null;
}

export function TeamTab({
  teamMembers,
  serviceProviders,
  redFlags = [],
  interrogatoryItems = [],
  gpEntityName,
}: TeamTabProps) {
  const teamFlags = redFlags.filter((f) =>
    (f.module || "").toLowerCase().includes("team") ||
    (f.source_module || "").toLowerCase().includes("team"),
  );
  const teamCritical = teamFlags.filter((f) => f.severity === "critical");
  const teamElevated = teamFlags.filter((f) => f.severity === "elevated");
  const teamMonitor = teamFlags.filter((f) => f.severity === "monitor");

  const teamQuestions = interrogatoryItems.filter((q) =>
    (q.module || q.source_module || "").toLowerCase().includes("team"),
  );

  return (
    <div className="space-y-5">
      {/* Sponsor Entity Card(s) */}
      <BlurFade>
        <SectionCard
          title="Sponsor Entities"
          subtitle="One card per GP — side-by-side for co-GP funds"
          icon={<Building2 className="h-4 w-4" />}
          empty={!gpEntityName}
          emptyMessage="No sponsor entity disclosed at L1."
        >
          {gpEntityName && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-bold text-foreground">{gpEntityName}</p>
                <FieldValueGrid
                  className="mt-2"
                  columns={1}
                  rows={[
                    { label: "Abbreviation", value: null },
                    { label: "Location", value: null },
                    { label: "CRD #", value: null },
                    { label: "SEC File #", value: null },
                    { label: "Registration Date", value: null },
                    { label: "AUM (USD M)", value: null },
                    { label: "Entity Type", value: null },
                    { label: "Founded", value: null },
                    { label: "Principal", value: null },
                  ]}
                />
              </div>
            </div>
          )}
        </SectionCard>
      </BlurFade>

      {/* Person Cards */}
      <BlurFade delay={0.04}>
        <SectionCard
          title="Person Cards"
          subtitle="Education · employment chain · credentials · regulatory checks"
          icon={<User className="h-4 w-4" />}
          empty={teamMembers.length === 0}
          emptyMessage="No principals parsed at L1."
        >
          {teamMembers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teamMembers.map((m) => {
                const initials = m.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                return (
                  <div key={m.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start gap-2.5">
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
                        { label: "Education", value: m.education },
                        { label: "Tenure", value: m.years_experience ? `${m.years_experience}y` : null },
                        { label: "Verification", value: m.verification_status },
                        { label: "Adverse Findings", value: m.adverse_findings ? "See note" : null },
                      ]}
                    />
                    {m.adverse_findings && (
                      <p className="text-[11px] text-severity-elevated mt-2 leading-relaxed">{m.adverse_findings}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </BlurFade>

      {/* Team Governance / Service Providers */}
      <BlurFade delay={0.06}>
        <SectionCard
          title="Team Governance & Service Providers"
          subtitle="Auditor, administrator, custodian, advisory board"
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

      {/* Network */}
      <BlurFade delay={0.08}>
        <SectionCard
          title="Team Network & Affiliations"
          subtitle="Sponsor ecosystem, prior-firm overlap (Section 7.6)"
          icon={<Network className="h-4 w-4" />}
          empty={!teamMembers.some((m) => Array.isArray(m.prior_affiliations) && (m.prior_affiliations as any[]).length > 0)}
          emptyMessage="No network affiliations parsed at L1."
        />
      </BlurFade>

      {/* Team Flags */}
      <BlurFade delay={0.1}>
        <SectionCard
          title="Team Flags"
          subtitle="Filtered from Risk · grouped by severity"
          icon={<Shield className="h-4 w-4" />}
        >
          <div className="space-y-3">
            <FlagLane title="CRITICAL" tone="critical" flags={teamCritical} />
            <FlagLane title="ELEVATED" tone="elevated" flags={teamElevated} />
            <FlagLane title="MONITOR" tone="monitor" flags={teamMonitor} />
          </div>
        </SectionCard>
      </BlurFade>

      {/* Team Interrogatory subset */}
      <BlurFade delay={0.12}>
        <SectionCard
          title="Team Interrogatory (A-series)"
          subtitle="Questions deep-linked from Interrogatory Matrix"
          icon={<MessageSquare className="h-4 w-4" />}
          empty={teamQuestions.length === 0}
          emptyMessage="No team-category questions generated at L1."
        >
          {teamQuestions.length > 0 && (
            <ul className="space-y-1.5">
              {teamQuestions.map((q) => (
                <li key={q.id} className="text-xs text-foreground/85 flex gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                    {q.question_id || "—"}
                  </span>
                  <span className="leading-relaxed">{q.question}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>
    </div>
  );
}
