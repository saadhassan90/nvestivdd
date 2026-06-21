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

const DEFAULT_BODY = `# Mutual Non-Disclosure Agreement

**Effective Date:** {{date}}

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into between the Disclosing Party ("Fund") and the Receiving Party ("Recipient"). The full executed copy of this Agreement will be made available to both parties upon countersignature.

## 1. Confidential Information
The Recipient acknowledges that, in connection with evaluating a potential investment in the Fund, it may receive confidential, proprietary, or non-public information including, without limitation, fund documents, performance data, investment strategy, pipeline, and limited-partner information ("Confidential Information").

## 2. Obligations
The Recipient agrees to:
(a) hold all Confidential Information in strict confidence;
(b) not disclose Confidential Information to any third party without prior written consent;
(c) use Confidential Information solely to evaluate the prospective investment;
(d) protect Confidential Information using at least the same degree of care it uses for its own confidential information.

## 3. Exclusions
Confidential Information does not include information that (i) is or becomes public other than through a breach of this Agreement, (ii) was known to the Recipient prior to disclosure, (iii) is rightfully received from a third party without restriction, or (iv) is independently developed without use of the Confidential Information.

## 4. Term
The Recipient's obligations under this Agreement shall survive for a period of two (2) years from the Effective Date.

## 5. No License
No license or other right under any intellectual property is granted by this Agreement.

## 6. Governing Law
This Agreement is governed by the laws of the State of Delaware, without regard to its conflict-of-laws principles.

## 7. Electronic Signature
The parties agree that this Agreement may be executed and delivered electronically and that an electronic signature has the same legal effect as a handwritten signature.
`;

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