import { useState } from "react";
import { Users, CheckCircle2, AlertTriangle, ShieldCheck, Linkedin } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MarkdownSectionCards } from "@/components/project/MarkdownSectionCards";
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

const VERIFICATION_BG: Record<string, string> = {
  verified: "bg-score-strong/10 border-score-strong/20",
  partially_verified: "bg-severity-elevated/10 border-severity-elevated/20",
  unverified: "bg-severity-critical/10 border-severity-critical/20",
};

export function TeamTab({ teamMembers, serviceProviders, reportSection, reportMarkdown, moduleScore }: TeamTabProps) {
  const hasMarkdown = !!reportMarkdown;
  const [visibleMembers, setVisibleMembers] = useState(12);

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
              Leadership structure, key person dependencies, and institutional governance frameworks.
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
        <MarkdownSectionCards content={reportMarkdown} baseDelay={0.05} />
      )}

      {!hasMarkdown && reportSection?.content && (
        <BlurFade delay={0.05}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Institutional Analysis
            </p>
            <MarkdownSectionCards content={reportSection.content} baseDelay={0.07} />
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

      {/* ── Team Member Cards ── */}
      {teamMembers.length > 0 && (
        <BlurFade delay={0.15}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Principal Profiles
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allMembers.slice(0, visibleMembers).map((member, i) => {
                const initials = member.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                const photoUrl = (member as any).photo_url as string | null;
                const verificationLabel = member.verification_status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
                const verificationColor = VERIFICATION_COLORS[member.verification_status] || "text-muted-foreground";
                const verificationBg = VERIFICATION_BG[member.verification_status] || "bg-muted border-border";

                return (
                  <BlurFade key={member.id} delay={0.15 + i * 0.03}>
                    <MagicCard className="!p-5">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar className="h-14 w-14 shrink-0 border-2 border-border">
                          {photoUrl && (
                            <AvatarImage src={photoUrl} alt={member.name} className="object-cover" />
                          )}
                          <AvatarFallback className="text-sm font-bold bg-muted text-muted-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground text-sm truncate">{member.name}</p>
                            {member.is_key_person && (
                              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{member.title || "—"}</p>
                          {member.years_experience && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {member.years_experience} years experience
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Affiliations */}
                      {affiliations(member).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {affiliations(member).map((aff, j) => (
                            <span
                              key={j}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground border border-border"
                            >
                              Ex-{aff}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Verification + Education */}
                      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${verificationBg} ${verificationColor}`}>
                          {member.verification_status === "verified" && <CheckCircle2 className="h-3 w-3" />}
                          {member.verification_status === "partially_verified" && <AlertTriangle className="h-3 w-3" />}
                          {verificationLabel}
                        </span>
                        {member.education && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[50%]">
                            {member.education}
                          </span>
                        )}
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
                );
              })}
            </div>

            {allMembers.length > visibleMembers && (
              <button
                onClick={() => setVisibleMembers((c) => c + 12)}
                className="w-full rounded-lg border border-border py-3 mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                View All Team Members ({allMembers.length})
              </button>
            )}
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
