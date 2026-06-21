export type NdaStatus =
  | "not_required"
  | "not_sent"
  | "requested"
  | "sent"
  | "viewed"
  | "signed"
  | "countersigned"
  | "expired"
  | "declined"
  | "revoked";

export interface NdaTemplate {
  id: string;
  name: string;
  version: number;
  bodyMd: string;
  createdAt: string;
  isDefault?: boolean;
}

export interface NdaAuditEvent {
  ts: string;
  actor: string; // "GP" | "LP" | "System"
  event: string;
  meta?: Record<string, unknown>;
}

export interface NdaRecord {
  id: string;
  raiseId: string;
  raiseName: string;
  lpId: string;
  lpName: string;
  lpEmail: string;
  templateId: string;
  templateVersion: number;
  status: NdaStatus;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  countersignedAt?: string;
  expiresAt?: string;
  signerName?: string;
  signerTitle?: string;
  signatureDataUrl?: string;
  ipAddress?: string;
  auditTrail: NdaAuditEvent[];
}

import NVESTIV_MUTUAL_NDA_MD from "@/assets/legal/nvestiv-mutual-nda.md?raw";

const DEFAULT_BODY = NVESTIV_MUTUAL_NDA_MD;

export function renderNdaBody(bodyMd: string, nda: Pick<NdaRecord, "raiseName" | "lpName" | "signerName" | "signerTitle" | "createdAt" | "signedAt">): string {
  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "____________________";
  const blank = (v?: string) => v && v.trim().length > 0 ? v : "____________________";
  const map: Record<string, string> = {
    date: fmt(nda.createdAt),
    EFFECTIVE_DATE: fmt(nda.createdAt),
    GP_COMPANY_NAME: nda.raiseName ? `Nvestiv GP — ${nda.raiseName}` : "Nvestiv GP",
    GP_ENTITY_TYPE_AND_JURISDICTION: "a Delaware limited partnership",
    GP_REGISTERED_ADDRESS: "1 Market Street, San Francisco, CA 94105, USA",
    GP_SIGNATORY_NAME: "Authorized GP Signatory",
    GP_SIGNATORY_TITLE: "Managing Partner",
    GP_SIGNATORY_EMAIL: "gp@nvestiv.example",
    GP_SIGNATURE: "/s/ GP",
    GP_EXECUTION_DATE: fmt(nda.createdAt),
    GP_AUTHORITY_CONFIRMED: "☑",
    GP_TIMESTAMP_UTC: nda.createdAt ?? "",
    GP_IP_ADDRESS: "—",
    LP_COMPANY_NAME: blank(nda.lpName),
    LP_ENTITY_TYPE_AND_JURISDICTION: "____________________",
    LP_REGISTERED_ADDRESS: "____________________",
    LP_SIGNATORY_NAME: blank(nda.signerName),
    LP_SIGNATORY_TITLE: blank(nda.signerTitle),
    LP_SIGNATORY_EMAIL: "____________________",
    LP_SIGNATURE: nda.signedAt ? "/s/ " + (nda.signerName ?? "LP") : "____________________",
    LP_EXECUTION_DATE: fmt(nda.signedAt),
    LP_AUTHORITY_CONFIRMED: nda.signedAt ? "☑" : "☐",
    LP_TIMESTAMP_UTC: nda.signedAt ?? "",
    LP_IP_ADDRESS: "—",
    DOCUMENT_ID: "—",
    AUDIT_HASH: "—",
    SCHEDULE_A_PURPOSE_DESCRIPTION: `Evaluation of a potential investment in ${nda.raiseName}.`,
    SCHEDULE_B_DESIGNATED_JURISDICTION: "Delaware, USA",
    SCHEDULE_B_ARBITRAL_INSTITUTION: "ICC (default)",
    SCHEDULE_C_CATEGORIES: "Fund PPM, LPA, track record, financial projections, pipeline, and related diligence materials.",
  };
  return bodyMd.replace(/\{\{(\w+)\}\}/g, (_, k) => map[k] ?? `\`{{${k}}}\``);
}

export const NDA_TEMPLATES: NdaTemplate[] = [
  {
    id: "tpl-std-mutual",
    name: "Nvestiv Standard Mutual NDA",
    version: 1,
    bodyMd: DEFAULT_BODY,
    createdAt: "2026-01-01T00:00:00Z",
    isDefault: true,
  },
];

export const NDAS: NdaRecord[] = [];

const listeners = new Set<() => void>();
export function subscribeNdas(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
function emit() { listeners.forEach((f) => f()); }

function nid() {
  return `nda-${Math.random().toString(36).slice(2, 10)}`;
}

export function getDefaultTemplate(): NdaTemplate {
  return NDA_TEMPLATES.find((t) => t.isDefault) ?? NDA_TEMPLATES[0];
}

export function getTemplate(id: string): NdaTemplate | undefined {
  return NDA_TEMPLATES.find((t) => t.id === id);
}

export function getNda(id: string): NdaRecord | undefined {
  return NDAS.find((n) => n.id === id);
}

export function getNdasByRaise(raiseId: string): NdaRecord[] {
  return NDAS.filter((n) => n.raiseId === raiseId);
}

export function getNdaByLp(raiseId: string, lpId: string): NdaRecord | undefined {
  return NDAS.find((n) => n.raiseId === raiseId && n.lpId === lpId);
}

export interface CreateNdaInput {
  raiseId: string;
  raiseName: string;
  lpId: string;
  lpName: string;
  lpEmail: string;
  templateId?: string;
  expiryDays?: number;
  initialStatus?: NdaStatus;
  signedAt?: string;
  countersignedAt?: string;
}

export function createNda(input: CreateNdaInput): NdaRecord {
  const tpl = getTemplate(input.templateId ?? "") ?? getDefaultTemplate();
  const now = new Date().toISOString();
  const expires = input.expiryDays
    ? new Date(Date.now() + input.expiryDays * 86400000).toISOString()
    : undefined;
  const rec: NdaRecord = {
    id: nid(),
    raiseId: input.raiseId,
    raiseName: input.raiseName,
    lpId: input.lpId,
    lpName: input.lpName,
    lpEmail: input.lpEmail,
    templateId: tpl.id,
    templateVersion: tpl.version,
    status: input.initialStatus ?? "not_sent",
    createdAt: now,
    expiresAt: expires,
    signedAt: input.signedAt,
    countersignedAt: input.countersignedAt,
    sentAt: input.initialStatus && input.initialStatus !== "not_sent" ? now : undefined,
    auditTrail: [
      { ts: now, actor: "GP", event: "NDA created" },
    ],
  };
  if (input.signedAt) {
    rec.auditTrail.push({ ts: input.signedAt, actor: "LP", event: "NDA signed" });
    rec.signerName = input.lpName;
  }
  if (input.countersignedAt) {
    rec.auditTrail.push({ ts: input.countersignedAt, actor: "GP", event: "NDA countersigned" });
  }
  NDAS.push(rec);
  emit();
  return rec;
}

export function sendNda(id: string, expiryDays = 30): NdaRecord | undefined {
  const n = getNda(id);
  if (!n) return;
  const now = new Date().toISOString();
  n.status = "sent";
  n.sentAt = now;
  n.expiresAt = new Date(Date.now() + expiryDays * 86400000).toISOString();
  n.auditTrail.push({ ts: now, actor: "GP", event: "NDA sent to recipient" });
  emit();
  return n;
}

export function markViewed(id: string): NdaRecord | undefined {
  const n = getNda(id);
  if (!n) return;
  if (n.status === "sent") {
    const now = new Date().toISOString();
    n.status = "viewed";
    n.viewedAt = now;
    n.auditTrail.push({ ts: now, actor: "LP", event: "NDA opened" });
    emit();
  }
  return n;
}

export function signNda(
  id: string,
  payload: { signerName: string; signerTitle: string; signatureDataUrl: string }
): NdaRecord | undefined {
  const n = getNda(id);
  if (!n) return;
  const now = new Date().toISOString();
  n.status = "signed";
  n.signedAt = now;
  n.signerName = payload.signerName;
  n.signerTitle = payload.signerTitle;
  n.signatureDataUrl = payload.signatureDataUrl;
  n.ipAddress = "192.0.2.42"; // mocked
  n.auditTrail.push({
    ts: now,
    actor: "LP",
    event: "NDA signed",
    meta: { signerName: payload.signerName, ip: n.ipAddress },
  });
  emit();
  return n;
}

export function countersignNda(id: string, gpName = "Fund Manager"): NdaRecord | undefined {
  const n = getNda(id);
  if (!n) return;
  const now = new Date().toISOString();
  n.status = "countersigned";
  n.countersignedAt = now;
  n.auditTrail.push({ ts: now, actor: "GP", event: "NDA countersigned", meta: { gpName } });
  emit();
  return n;
}

export function revokeNda(id: string): NdaRecord | undefined {
  const n = getNda(id);
  if (!n) return;
  const now = new Date().toISOString();
  n.status = "revoked";
  n.auditTrail.push({ ts: now, actor: "GP", event: "NDA access revoked" });
  emit();
  return n;
}

export function deleteNda(id: string): void {
  const idx = NDAS.findIndex((n) => n.id === id);
  if (idx >= 0) {
    NDAS.splice(idx, 1);
    emit();
  }
}

export const NDA_STATUS_META: Record<NdaStatus, { label: string; tone: "muted" | "info" | "warn" | "good" | "bad" }> = {
  not_required: { label: "Not required", tone: "muted" },
  not_sent: { label: "Not sent", tone: "muted" },
  requested: { label: "Requested", tone: "info" },
  sent: { label: "Sent", tone: "info" },
  viewed: { label: "Viewed", tone: "info" },
  signed: { label: "Signed", tone: "good" },
  countersigned: { label: "Fully executed", tone: "good" },
  expired: { label: "Expired", tone: "warn" },
  declined: { label: "Declined", tone: "bad" },
  revoked: { label: "Revoked", tone: "bad" },
};

/** Seed records from existing pipeline LPs. Called once on first import. */
export function seedNdasFromRaises(
  raises: { id: string; name: string; lps: { id: string; name: string; ndaSignedAt?: string }[] }[]
) {
  if (NDAS.length > 0) return;
  for (const r of raises) {
    for (const lp of r.lps) {
      if (!lp.ndaSignedAt) continue;
      const signedAt = new Date(lp.ndaSignedAt).toISOString();
      const countersignedAt = new Date(new Date(lp.ndaSignedAt).getTime() + 86400000).toISOString();
      createNda({
        raiseId: r.id,
        raiseName: r.name,
        lpId: lp.id,
        lpName: lp.name,
        lpEmail: `${lp.name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
        signedAt,
        countersignedAt,
        initialStatus: "countersigned",
      });
    }
  }
}