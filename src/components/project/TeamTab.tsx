import { useState } from "react";
import { Users, CheckCircle2, AlertTriangle, ChevronRight, ShieldCheck } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ReportMarkdownSection } from "@/components/project/ReportMarkdownSection";
import type { Tables } from "@/integrations/supabase/types";

interface TeamTabProps {
  teamMembers: Tables<"team_members">[];
  serviceProviders: Tables<"service_providers">[];
  reportSection?: { section_title: string | null; content: string | null };
  reportMarkdown?: string | null;
  moduleScore?: number | null;
}

const VERIFICATION_COLORS: Record<string, string> = {
  verified: "text-score-strong",
  partially_verified: "text-severity-elevated",
  unverified: "text-severity-critical",
};

const SCORE_BAR_COLOR = (val: string | undefined) => {
  if (!val) return "bg-muted";
  const lower = val.toLowerCase();
  if (lower === "high" || lower === "active" || lower === "daily" || lower === "quarterly" || lower === "pass" || lower === "verified")
    return "bg-score-strong";
  if (lower === "partial" || lower === "medium" || lower === "monthly")
    return "bg-severity-elevated";
  return "bg-severity-critical";
};

export function TeamTab({ teamMembers, serviceProviders, reportSection, reportMarkdown, moduleScore }: TeamTabProps) {
  const hasMarkdown = !!reportMarkdown;
  const [visibleMembers, setVisibleMembers] = useState(5);

  const keyPersonnel = teamMembers.filter((m) => m.is_key_person);
  const allMembers = [...teamMembers].sort((a, b) => (a.order_index ?? 99) - (b.order_index ?? 99));
  const affiliations = (m: Tables<"team_members">) => (m.prior_affiliations as string[]) || [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Section Header ── */}
      <BlurFade>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Team & Governance
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              A comprehensive assessment of the leadership structure, key person dependencies, and the institutional frameworks governing fund operations.
            </p>
          </div>
          {moduleScore !== undefined && moduleScore !== null && (
            <div className="shrink-0 flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card">
                <span className={`text-lg font-bold ${
                  moduleScore >= 85 ? "text-score-strong" : moduleScore >= 70 ? "text-score-advance" : moduleScore >= 50 ? "text-score-review" : "text-severity-critical"
                }`}>
                  {moduleScore}
                </span>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Score</span>
            </div>
          )}
        </div>
      </BlurFade>

      {/* ── Report Narrative ── */}
      {hasMarkdown && (
        <BlurFade delay={0.05}>
          <ReportMarkdownSection content={reportMarkdown} />
        </BlurFade>
      )}

      {!hasMarkdown && reportSection?.content && (
        <BlurFade delay={0.05}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Institutional Analysis
            </p>
            <ReportMarkdownSection content={reportSection.content} />
          </div>
        </BlurFade>
      )}

      {/* ── Governance Metrics ── */}
      {serviceProviders.length > 0 && (
        <BlurFade delay={0.1}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Governance Metrics
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {serviceProviders.slice(0, 4).map((sp) => {
                const barColor = sp.is_verified ? "bg-score-strong" : sp.is_disclosed ? "bg-severity-elevated" : "bg-severity-critical";
                return (
                  <MagicCard key={sp.id} className="!p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {sp.provider_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-foreground mt-1">
                      {sp.provider_name || "N/A"}
                    </p>
                    <div className={`h-0.5 w-full rounded-full mt-2 ${barColor}`} />
                    {sp.notes && (
                      <p className="text-[10px] text-score-strong font-medium mt-1">{sp.notes}</p>
                    )}
                  </MagicCard>
                );
              })}
            </div>
          </div>
        </BlurFade>
      )}

      {/* ── Principal Profiles Table (Desktop) ── */}
      {teamMembers.length > 0 && (
        <BlurFade delay={0.15}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Principal Profiles
            </p>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pr-4">Name</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-4">Role</th>
                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-4">Experience</th>
                    <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pl-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allMembers.slice(0, visibleMembers).map((member) => (
                    <tr key={member.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{member.name}</p>
                          {member.is_key_person && (
                            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        {affiliations(member).length > 0 && (
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                            Ex-{affiliations(member)[0]}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {member.title || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {member.years_experience ? `${member.years_experience} Years` : "—"}
                      </td>
                      <td className="py-3 pl-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${VERIFICATION_COLORS[member.verification_status] || "text-muted-foreground"}`}>
                          {member.verification_status === "verified" && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {member.verification_status === "partially_verified" && <AlertTriangle className="h-3.5 w-3.5" />}
                          {member.verification_status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Adverse findings row */}
              {allMembers.slice(0, visibleMembers).some((m) => m.adverse_findings) && (
                <div className="mt-3 space-y-2">
                  {allMembers
                    .slice(0, visibleMembers)
                    .filter((m) => m.adverse_findings)
                    .map((m) => (
                      <div key={m.id} className="flex items-start gap-2 rounded-lg bg-severity-critical/5 border border-severity-critical/20 p-3">
                        <AlertTriangle className="h-4 w-4 text-severity-critical shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-severity-critical">{m.name} — Adverse Finding</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{m.adverse_findings}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {allMembers.length > visibleMembers && (
                <button
                  onClick={() => setVisibleMembers((c) => c + 10)}
                  className="w-full rounded-lg border border-border py-3 mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  View All Team Members ({allMembers.length})
                </button>
              )}
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {allMembers.slice(0, visibleMembers).map((member, i) => (
                <BlurFade key={member.id} delay={i * 0.03}>
                  <MagicCard>
                    <div className="flex items-center gap-3">
                      {/* Avatar placeholder */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                        <span className="text-sm font-bold text-muted-foreground">
                          {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-foreground text-sm truncate">{member.name}</p>
                          {member.verification_status === "verified" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.title || "—"}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          {affiliations(member).length > 0 && `Ex-${affiliations(member)[0]} · `}
                          {member.years_experience ? `${member.years_experience}Y Experience` : ""}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>

                    {/* Adverse finding */}
                    {member.adverse_findings && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-severity-critical/5 border border-severity-critical/20 p-2.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-severity-critical shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground">{member.adverse_findings}</p>
                      </div>
                    )}
                  </MagicCard>
                </BlurFade>
              ))}

              {allMembers.length > visibleMembers && (
                <button
                  onClick={() => setVisibleMembers((c) => c + 10)}
                  className="w-full rounded-lg border border-border py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  View All Team Members ({allMembers.length})
                </button>
              )}
            </div>
          </div>
        </BlurFade>
      )}

      {/* ── Service Providers (remaining) ── */}
      {serviceProviders.length > 4 && (
        <BlurFade delay={0.2}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Service Providers
            </p>
            <div className="space-y-2">
              {serviceProviders.slice(4).map((sp) => (
                <div key={sp.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {sp.provider_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {sp.provider_name || <span className="text-severity-critical italic">Not Disclosed</span>}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase ${
                    sp.is_verified ? "text-score-strong" : sp.is_disclosed ? "text-severity-elevated" : "text-severity-critical"
                  }`}>
                    {sp.is_verified && <CheckCircle2 className="h-3 w-3" />}
                    {sp.is_verified ? "Verified" : sp.is_disclosed ? "Unverified" : "Not Disclosed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </BlurFade>
      )}

      {/* ── Citation Legend ── */}
      {teamMembers.length > 0 && (
        <div className="flex items-center gap-6 pt-3 border-t border-border">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Citation Legend:</p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-[10px] text-muted-foreground">[1] GP-Sourced</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-score-strong" />
            <span className="text-[10px] text-muted-foreground">[3] Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-severity-elevated" />
            <span className="text-[10px] text-muted-foreground">[!] Flagged</span>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {teamMembers.length === 0 && serviceProviders.length === 0 && !hasMarkdown && (
        <BlurFade>
          <MagicCard>
            <div className="text-center py-12">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No team data available yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Team profiles will appear once the analysis is complete.</p>
            </div>
          </MagicCard>
        </BlurFade>
      )}
    </div>
  );
}
