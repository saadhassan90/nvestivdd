import { useState } from "react";
import { Card, CardBody, Chip, Button } from "@heroui/react";
import { Shield, AlertTriangle, Eye } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { formatRelativeTime } from "@/lib/score-utils";
import type { Tables } from "@/integrations/supabase/types";

interface RedFlagsTabProps {
  redFlags: Tables<"red_flags">[];
}

const MODULE_LABELS: Record<string, string> = {
  module_a: "Financial & Performance",
  module_b: "Team & Management",
  module_c: "Strategy & Market",
  module_d: "Terms & Structure",
  module_e: "Operational",
};

export function RedFlagsTab({ redFlags }: RedFlagsTabProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const criticalFlags = redFlags.filter(f => f.severity === 'critical');
  const elevatedFlags = redFlags.filter(f => f.severity === 'elevated');
  const monitorFlags = redFlags.filter(f => f.severity === 'monitor');

  const filtered = activeFilter === "all"
    ? redFlags
    : redFlags.filter(f => f.severity === activeFilter);

  const severityConfig: Record<string, { border: string; chipColor: "danger" | "warning" | "primary"; bg: string }> = {
    critical: { border: "border-l-danger", chipColor: "danger", bg: "bg-danger" },
    elevated: { border: "border-l-warning", chipColor: "warning", bg: "bg-warning" },
    monitor: { border: "border-l-primary", chipColor: "primary", bg: "bg-primary" },
  };

  const renderFlag = (flag: Tables<"red_flags">, i: number) => {
    const config = severityConfig[flag.severity] || severityConfig.monitor;
    return (
      <BlurFade key={flag.id} delay={i * 0.03}>
        <Card shadow="sm" className={`border-l-4 ${config.border}`}>
          <CardBody className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Chip size="sm" color={config.chipColor} variant="solid" classNames={{ content: "text-[10px] font-bold uppercase tracking-wider" }}>
                    {flag.severity}
                  </Chip>
                  {flag.confidence && (
                    <span className="text-[10px] text-default-400 uppercase">Confidence: {flag.confidence}</span>
                  )}
                  <span className="text-[10px] text-default-400">
                    {formatRelativeTime(flag.logged_at)} • {MODULE_LABELS[flag.module || ''] || flag.module || 'General'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">{flag.title}</p>
                <p className="text-xs text-default-500 mt-1">{flag.description}</p>

                <div className="flex flex-col gap-2 mt-3">
                  {flag.data_room_action && (
                    <div className="text-[10px] text-default-400">
                      <span className="font-semibold uppercase tracking-wider">Data Room: </span>
                      {flag.data_room_action}
                    </div>
                  )}
                  {flag.interrogatory_question && (
                    <div className="text-[10px] text-default-400">
                      <span className="font-semibold uppercase tracking-wider">Interrogatory: </span>
                      <span className="italic">"{flag.interrogatory_question}"</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </BlurFade>
    );
  };

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
          <p className="text-xs sm:text-sm text-default-400 mt-1">Tiered risk assessment from L1 analysis and autonomous research.</p>
        </div>
      </BlurFade>

      <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {FILTERS.map(f => (
          <Button
            key={f.key}
            size="sm"
            variant={activeFilter === f.key ? "solid" : "bordered"}
            color={activeFilter === f.key ? "primary" : "default"}
            onPress={() => setActiveFilter(f.key)}
            className="text-xs"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {activeFilter === "all" ? (
        <div className="space-y-6">
          {criticalFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-danger" />
                <span className="text-xs font-semibold uppercase tracking-wider text-danger">
                  Critical — Require Resolution Before Investment
                </span>
              </div>
              <div className="space-y-3">{criticalFlags.map((flag, i) => renderFlag(flag, i))}</div>
            </div>
          )}

          {elevatedFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-xs font-semibold uppercase tracking-wider text-warning">
                  Elevated — Material Diligence Items
                </span>
              </div>
              <div className="space-y-3">{elevatedFlags.map((flag, i) => renderFlag(flag, i))}</div>
            </div>
          )}

          {monitorFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Monitor — Track But Not Deal-Breaking
                </span>
              </div>
              <div className="space-y-3">{monitorFlags.map((flag, i) => renderFlag(flag, i))}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">{filtered.map((flag, i) => renderFlag(flag, i))}</div>
      )}

      {redFlags.length === 0 && (
        <Card shadow="sm">
          <CardBody><p className="text-sm text-default-400 text-center py-8">No red flags identified yet.</p></CardBody>
        </Card>
      )}
    </div>
  );
}
