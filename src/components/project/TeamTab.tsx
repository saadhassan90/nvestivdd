import { useState } from "react";
import { Users, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
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

const VERIFICATION_BADGE: Record<string, { label: string; color: string; bg: string; Icon: typeof CheckCircle2 | typeof AlertTriangle | null }> = {
  verified: { label: "Verified", color: "text-score-strong", bg: "bg-score-strong/10 border-score-strong/20", Icon: CheckCircle2 },
  partially_verified: { label: "Partial", color: "text-severity-elevated", bg: "bg-severity-elevated/10 border-severity-elevated/20", Icon: AlertTriangle },
  unverified: { label: "Unverified", color: "text-severity-critical", bg: "bg-severity-critical/10 border-severity-critical/20", Icon: null },
};

export function TeamTab({ teamMembers, serviceProviders, reportSection, reportMarkdown, moduleScore }: TeamTabProps) {
  const hasMarkdown = !!reportMarkdown;
  const [showAll, setShowAll] = useState(false);

  const allMembers = [...teamMembers].sort((a, b) => (a.order_index ?? 99) - (b.order_index ?? 99));
  const visible = showAll ? allMembers : allMembers.slice(0, 9);
  const affiliations = (m: Tables<"team_members">) => (m.prior_affiliations as string[]) || [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <BlurFade>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Team & Governance
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Leadership structure, key person dependencies, and institutional governance.
            </p>
          </div>
          {moduleScore != null && (
            <div className="shrink-0 flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card">
                <span className={`text-lg font-bold ${
                  moduleScore >= 85 ? "text-score-strong" : moduleScore >= 70 ? "text-score-advance" : moduleScore >= 50 ? "text-score-review" : "text-severity-critical"
                }`}>{moduleScore}</span>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Score</span>
            </div>
          )}
        </div>
      </BlurFade>

      {/* Report Narrative */}
      {hasMarkdown && <MarkdownSectionCards content={reportMarkdown} baseDelay={0.05} />}
      {!hasMarkdown && reportSection?.content && (
        <BlurFade delay={0.05}>
          <MarkdownSectionCards content={reportSection.content} baseDelay={0.07} />
        </BlurFade>
      )}

      {/* Team Members — card grid */}
      {teamMembers.length > 0 && (
        <BlurFade delay={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((member, i) => {
              const initials = member.name.split(" ").map(n => n[0]).join("").slice(0, 2);
              const photoUrl = (member as any).photo_url as string | null;
              const v = VERIFICATION_BADGE[member.verification_status] || VERIFICATION_BADGE.unverified;
              const affs = affiliations(member);

              return (
                <BlurFade key={member.id} delay={0.1 + i * 0.025}>
                  <MagicCard className="!p-0 overflow-hidden">
                    {/* Card top accent */}
                    <div className="px-5 pt-5 pb-4">
                      <div className="flex items-start gap-3.5">
                        <Avatar className="h-12 w-12 shrink-0 border-2 border-border">
                          {photoUrl && <AvatarImage src={photoUrl} alt={member.name} className="object-cover" />}
                          <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground text-sm truncate">{member.name}</p>
                            {member.is_key_person && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{member.title || "—"}</p>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px] text-muted-foreground">
                        {member.years_experience && (
                          <span>{member.years_experience}y exp</span>
                        )}
                        {member.education && (
                          <span className="truncate max-w-[160px]">{member.education}</span>
                        )}
                      </div>

                      {/* Affiliations */}
                      {affs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {affs.slice(0, 3).map((aff, j) => (
                            <span key={j} className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                              Ex-{aff}
                            </span>
                          ))}
                          {affs.length > 3 && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                              +{affs.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-border/50 bg-muted/30 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${v.color}`}>
                        {v.Icon && <v.Icon className="h-3 w-3" />}
                        {v.label}
                      </span>
                      {member.assessment_rating && (
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          {member.assessment_rating}
                        </span>
                      )}
                    </div>

                    {/* Adverse finding */}
                    {member.adverse_findings && (
                      <div className="px-5 py-2.5 border-t border-severity-critical/20 bg-severity-critical/5 flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-severity-critical shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{member.adverse_findings}</p>
                      </div>
                    )}
                  </MagicCard>
                </BlurFade>
              );
            })}
          </div>

          {allMembers.length > 9 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full rounded-lg border border-border py-3 mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              View All ({allMembers.length})
            </button>
          )}
        </BlurFade>
      )}

      {/* Service Providers */}
      {serviceProviders.length > 0 && (
        <BlurFade delay={0.15}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Service Providers
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {serviceProviders.map((sp) => {
                const barColor = sp.is_verified ? "bg-score-strong" : sp.is_disclosed ? "bg-severity-elevated" : "bg-severity-critical";
                return (
                  <MagicCard key={sp.id} className="!p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {sp.provider_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm font-bold text-foreground mt-1 truncate">
                      {sp.provider_name || <span className="text-severity-critical italic">Not Disclosed</span>}
                    </p>
                    <div className={`h-0.5 w-full rounded-full mt-2 ${barColor}`} />
                  </MagicCard>
                );
              })}
            </div>
          </div>
        </BlurFade>
      )}

      {/* Empty */}
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
