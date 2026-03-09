import { useState } from "react";
import { Shield, AlertTriangle, Eye } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { formatRelativeTime } from "@/lib/score-utils";
import type { Tables } from "@/integrations/supabase/types";

const MODULE_LABELS: Record<string, string> = {
  module_a: "Financial & Performance",
  module_b: "Team & Management",
  module_c: "Strategy & Market",
  module_d: "Terms & Structure",
  module_e: "Operational",
};

interface RedFlagsTabProps {
  redFlags: Tables<"red_flags">[];
}

export function RedFlagsTab({ redFlags }: RedFlagsTabProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const criticalFlags = redFlags.filter(f => f.severity === 'critical');
  const elevatedFlags = redFlags.filter(f => f.severity === 'elevated');
  const monitorFlags = redFlags.filter(f => f.severity === 'monitor');

  const filtered = activeFilter === "all"
    ? redFlags
    : redFlags.filter(f => f.severity === activeFilter);

  const renderFlag = (flag: Tables<"red_flags">, i: number) => (
    <BlurFade key={flag.id} delay={i * 0.03}>
      <MagicCard className={`border-l-4 ${
        flag.severity === 'critical' ? 'border-l-severity-critical' :
        flag.severity === 'elevated' ? 'border-l-severity-elevated' : 'border-l-severity-monitor'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground ${
                flag.severity === 'critical' ? 'bg-severity-critical' :
                flag.severity === 'elevated' ? 'bg-severity-elevated' : 'bg-severity-monitor'
              }`}>
                {flag.severity}
              </span>
              {flag.confidence && (
                <span className="text-[10px] text-muted-foreground uppercase">
                  Confidence: {flag.confidence}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(flag.logged_at)} • {flag.module || 'General'}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">{flag.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{flag.description}</p>

            {/* Linked actions */}
            <div className="flex flex-wrap gap-3 mt-3">
              {flag.data_room_action && (
                <div className="text-[10px] text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Data Room: </span>
                  {flag.data_room_action}
                </div>
              )}
              {flag.interrogatory_question && (
                <div className="text-[10px] text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Interrogatory: </span>
                  <span className="italic">"{flag.interrogatory_question}"</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </MagicCard>
    </BlurFade>
  );

  const FILTERS = [
    { key: "all", label: `All (${redFlags.length})` },
    { key: "critical", label: `Critical (${criticalFlags.length})` },
    { key: "elevated", label: `Elevated (${elevatedFlags.length})` },
    { key: "monitor", label: `Monitor (${monitorFlags.length})` },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <BlurFade>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Red Flag Summary</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Tiered risk assessment from L1 analysis and autonomous research.</p>
        </div>
      </BlurFade>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`rounded-full px-3 sm:px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeFilter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tiered display when "all" is selected */}
      {activeFilter === "all" ? (
        <div className="space-y-6">
          {criticalFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-severity-critical" />
                <span className="text-xs font-semibold uppercase tracking-wider text-severity-critical">
                  Critical — Require Resolution Before Investment
                </span>
              </div>
              <div className="space-y-3">
                {criticalFlags.map((flag, i) => renderFlag(flag, i))}
              </div>
            </div>
          )}

          {elevatedFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-severity-elevated" />
                <span className="text-xs font-semibold uppercase tracking-wider text-severity-elevated">
                  Elevated — Material Diligence Items
                </span>
              </div>
              <div className="space-y-3">
                {elevatedFlags.map((flag, i) => renderFlag(flag, i))}
              </div>
            </div>
          )}

          {monitorFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-severity-monitor" />
                <span className="text-xs font-semibold uppercase tracking-wider text-severity-monitor">
                  Monitor — Track But Not Deal-Breaking
                </span>
              </div>
              <div className="space-y-3">
                {monitorFlags.map((flag, i) => renderFlag(flag, i))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((flag, i) => renderFlag(flag, i))}
        </div>
      )}

      {redFlags.length === 0 && (
        <MagicCard>
          <p className="text-sm text-muted-foreground text-center py-8">No red flags identified yet.</p>
        </MagicCard>
      )}
    </div>
  );
}
