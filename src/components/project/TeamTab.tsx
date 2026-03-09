import { useState } from "react";
import { Users, CheckCircle2, AlertTriangle, Shield, ExternalLink } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { MarkdownContent } from "@/components/project/MarkdownContent";


interface TeamMember {
  id: string;
  name: string;
  title: string | null;
  role_category: string | null;
  years_experience: number | null;
  prior_affiliations: string[] | null;
  education: string | null;
  verification_status: string;
  verification_detail: string | null;
  is_key_person: boolean;
  adverse_findings: string | null;
  adverse_finding_severity: string | null;
  assessment_rating: string | null;
  order_index: number | null;
}

interface TeamTabProps {
  teamMembers: TeamMember[];
  serviceProviders: ServiceProvider[];
}

interface ServiceProvider {
  id: string;
  provider_type: string;
  provider_name: string | null;
  is_disclosed: boolean;
  is_verified: boolean | null;
  verification_detail: string | null;
  importance: string;
  notes: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  leadership: "Leadership",
  investment_team: "Investment Team",
  operations: "Operations",
  sustainability: "Sustainability",
  business_development: "Business Development",
  other: "Other",
};

const VERIFICATION_COLORS: Record<string, string> = {
  verified: "text-score-strong bg-score-strong/10",
  partially_verified: "text-severity-elevated bg-severity-elevated/10",
  unverified: "text-severity-critical bg-severity-critical/10",
};

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: "text-severity-critical",
  important: "text-severity-elevated",
  standard: "text-muted-foreground",
};

export function TeamTab({ teamMembers, serviceProviders }: TeamTabProps) {
  const [activeSection, setActiveSection] = useState<"team" | "providers">(teamMembers.length > 0 ? "team" : "providers");

  // Group team by role_category
  const grouped: Record<string, TeamMember[]> = {};
  teamMembers.forEach(m => {
    const cat = m.role_category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(m);
  });

  const categoryOrder = ["leadership", "investment_team", "operations", "sustainability", "business_development", "other"];

  return (
    <div className="space-y-4 sm:space-y-6">
      <BlurFade>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Team & Operations</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Team roster, verification status, and service provider assessment.</p>
        </div>
      </BlurFade>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveSection("team")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeSection === "team" ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Team ({teamMembers.length})
        </button>
        <button
          onClick={() => setActiveSection("providers")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeSection === "providers" ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Service Providers ({serviceProviders.length})
        </button>
      </div>

      {activeSection === "team" && (
        <div className="space-y-6">
          {teamMembers.length === 0 ? (
            <MagicCard>
              <p className="text-sm text-muted-foreground text-center py-8">No team member data available yet.</p>
            </MagicCard>
          ) : (
            categoryOrder.map(cat => {
              const members = grouped[cat];
              if (!members?.length) return null;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {ROLE_LABELS[cat] || cat}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {members.map((member, i) => (
                      <BlurFade key={member.id} delay={i * 0.03}>
                        <MagicCard className={member.is_key_person ? 'border-l-4 border-l-severity-elevated' : ''}>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-foreground">{member.name}</p>
                                {member.is_key_person && (
                                  <span className="inline-flex items-center rounded-full bg-severity-elevated/10 px-2 py-0.5 text-[9px] font-bold uppercase text-severity-elevated">
                                    Key Person
                                  </span>
                                )}
                              </div>
                              {member.title && <p className="text-xs text-muted-foreground mt-0.5">{member.title}</p>}

                              <div className="flex flex-wrap gap-2 mt-2">
                                {member.years_experience && (
                                  <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                                    {member.years_experience}+ yrs experience
                                  </span>
                                )}
                                {member.education && (
                                  <span className="text-[10px] rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                                    {member.education}
                                  </span>
                                )}
                              </div>

                              {member.prior_affiliations && (member.prior_affiliations as string[]).length > 0 && (
                                <div className="mt-2">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prior: </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {(member.prior_affiliations as string[]).join(", ")}
                                  </span>
                                </div>
                              )}

                              {member.verification_detail && (
                                <p className="text-[11px] text-muted-foreground mt-2">{member.verification_detail}</p>
                              )}

                              {member.adverse_findings && (
                                <div className="mt-2 rounded-lg bg-severity-critical/5 border border-severity-critical/20 p-2">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <AlertTriangle className="h-3 w-3 text-severity-critical" />
                                    <span className="text-[10px] font-bold uppercase text-severity-critical">Adverse Finding</span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">{member.adverse_findings}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${VERIFICATION_COLORS[member.verification_status] || ''}`}>
                                {member.verification_status === 'verified' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {member.verification_status.replace('_', ' ')}
                              </span>
                              {member.assessment_rating && (
                                <span className="text-[10px] text-muted-foreground">{member.assessment_rating}</span>
                              )}
                            </div>
                          </div>
                        </MagicCard>
                      </BlurFade>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeSection === "providers" && (
        <div className="space-y-3">
          {serviceProviders.length === 0 ? (
            <MagicCard>
              <p className="text-sm text-muted-foreground text-center py-8">No service provider data available yet.</p>
            </MagicCard>
          ) : (
            serviceProviders.map((sp, i) => (
              <BlurFade key={sp.id} delay={i * 0.03}>
                <MagicCard>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {sp.provider_type.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-bold uppercase ${IMPORTANCE_COLORS[sp.importance] || ''}`}>
                          {sp.importance}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-1">
                        {sp.provider_name || <span className="text-severity-critical italic">Not Disclosed</span>}
                      </p>
                      {sp.notes && <p className="text-xs text-muted-foreground mt-1">{sp.notes}</p>}
                      {sp.verification_detail && <p className="text-[11px] text-muted-foreground mt-1">{sp.verification_detail}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {sp.is_disclosed ? (
                        sp.is_verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-score-strong/10 px-2 py-0.5 text-[10px] font-bold text-score-strong">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-severity-elevated/10 px-2 py-0.5 text-[10px] font-bold text-severity-elevated">
                            Unverified
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-severity-critical/10 px-2 py-0.5 text-[10px] font-bold text-severity-critical">
                          Not Disclosed
                        </span>
                      )}
                    </div>
                  </div>
                </MagicCard>
              </BlurFade>
            ))
          )}
        </div>
      )}

    </div>
  );
}
