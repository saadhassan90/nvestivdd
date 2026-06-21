
## Goal
Build an NDA e-signing system that (1) tracks NDA state for every LP in every raise's pipeline, (2) gates data-room access on a signed NDA, and (3) gives GPs a dedicated NDA management page in the sidebar where they can view, download, and export signed and pending NDAs.

This is a frontend / mock-data build (consistent with the existing GP raises, which live in `src/mocks/gp/raises.ts`). No backend changes — signatures are simulated and PDFs generated client-side.

---

## 1. NDA states (the workflow)

Every pipeline LP gets an `ndaStatus` instead of today's single `ndaSignedAt`. States, in funnel order:

| State | Meaning | Trigger |
|---|---|---|
| `not_required` | NDA gating off for this LP / raise | GP toggle |
| `not_sent` | LP exists in pipeline, no NDA action taken | default |
| `requested` | LP requested access; NDA owed to them | LP-initiated (or GP marks) |
| `sent` | NDA dispatched, awaiting signature | GP clicks "Send NDA" |
| `viewed` | LP opened the NDA link | sign page load |
| `signed` | LP completed e-sign | sign submit |
| `countersigned` | GP signed back (fully executed) | GP action |
| `expired` | Sent link past expiry without signature | time-based |
| `declined` | LP declined to sign | LP action |
| `revoked` | GP revoked access | GP action |

Data room access is unlocked only at `signed` or `countersigned`. Share modal's existing "Require NDA acceptance" toggle wires into this.

## 2. Pipeline UI changes

`src/pages/gp/raise/RaisePipeline.tsx` — replace the current `Consent` column with an `NDA` column that renders a status pill (color-coded by state) and a row-level action menu:

- Send NDA / Resend
- View NDA
- Download PDF (signed copy)
- Mark as countersigned
- Revoke access

Per-row "Send NDA" opens a small `SendNdaModal` (template picker, expiry, optional note). Status pill is clickable to open the NDA detail drawer (see §5).

## 3. NDA template

`src/mocks/gp/ndas.ts` (new) seeds one default template ("Nvestiv Standard Mutual NDA v1") with placeholder body. Schema:

```ts
type NdaTemplate = { id; name; version; bodyMd; createdAt; isDefault };
```

GP can later upload additional templates; for now one default is enough. The actual NDA copy will be provided later — placeholder lorem is fine until then.

## 4. NDA records

Single source of truth: `src/mocks/gp/ndas.ts` exports an `NDAS` array of records:

```ts
type NdaRecord = {
  id;
  raiseId;
  lpId;           // links back to L2Lp in raises.ts
  lpName;
  lpEmail;
  templateId;
  templateVersion;
  status: NdaStatus;
  sentAt?; viewedAt?; signedAt?; countersignedAt?; expiresAt?;
  signerName?; signerTitle?;
  signatureDataUrl?;   // base64 PNG from canvas
  ipAddress?;          // mocked
  auditTrail: { ts; actor; event; meta? }[];
};
```

Helpers: `createNda`, `sendNda`, `markViewed`, `signNda`, `countersign`, `revoke`, `getNdasByRaise`, `getNdaByLp`, plus a `subscribeNdas` listener so the pipeline and NDA page re-render.

## 5. NDA detail drawer

Click any NDA pill → side drawer showing: status timeline, signer details, audit trail, embedded document preview, and buttons: Download PDF, Resend, Revoke, Countersign.

## 6. Sign flow (LP side)

New route `/nda/:ndaId` (public-ish, no auth in this mock):

1. Loads NDA + template, marks `viewed`.
2. Renders the NDA body (markdown) scrollable.
3. Required fields: full name, title, "I agree" checkbox.
4. Signature pad (HTML canvas) — captured as data URL.
5. Submit → status `signed`, timestamps recorded, audit trail appended, success screen with download link.

Component: `src/pages/nda/NdaSignPage.tsx`. Lightweight signature pad implemented inline (no extra dep) — mouse/touch on canvas → toDataURL.

## 7. NDA management page (sidebar)

Add a new sidebar entry in `src/components/gp/GpSidebar.tsx`:

```
Chat · Raises · Pipeline · NDAs · Contacts · Settings
```

Icon: `FileSignature` from lucide-react. Route: `/ndas`.

`src/pages/gp/Ndas.tsx` (new) — table view of every NDA across all raises:

Columns: LP · Raise · Template · Status pill · Sent · Signed · Expires · Actions
Filters: status (multi), raise (select), date range, search (LP name/email)
Bulk actions: export selected as ZIP (mocked toast), resend pending

Row actions:
- View — opens NDA detail drawer (same component as §5)
- Download PDF — generates and downloads via `jsPDF` (already a common dep) or a tiny `pdf-lib`-style helper. If no PDF lib is installed, add `jspdf` via `bun add`. PDF includes NDA body, signer block, signature image, audit trail.
- Export CSV — top-of-page button exports the filtered list (LP, raise, status, dates, signer).

Summary tiles at top: Total NDAs · Signed · Pending · Expired.

## 8. Share-modal integration

In `src/components/gp/ShareRaiseModal.tsx`, when "Require NDA acceptance" is on and an email is added, on Send we also call `createNda(...)` for each recipient (if a matching LP exists, link it; otherwise create a pending pipeline entry) and the toast becomes "Share link + NDA sent to N recipients".

## 9. Data migration of existing mock

`L2Lp.ndaSignedAt` is replaced by `ndaStatus` + `ndaId`. All existing mocked LPs that had a `ndaSignedAt` date become `status: "countersigned"` with that timestamp, and a corresponding `NdaRecord` is seeded. Pipeline page reads from the new fields.

## 10. Files touched

```text
NEW  src/mocks/gp/ndas.ts                 (templates + records store)
NEW  src/components/gp/NdaStatusPill.tsx
NEW  src/components/gp/SendNdaModal.tsx
NEW  src/components/gp/NdaDetailDrawer.tsx
NEW  src/components/gp/SignaturePad.tsx
NEW  src/pages/nda/NdaSignPage.tsx        (route /nda/:ndaId)
NEW  src/pages/gp/Ndas.tsx                (route /ndas)
NEW  src/lib/nda-pdf.ts                   (PDF generator)
EDIT src/mocks/gp/raises.ts               (L2Lp: ndaStatus + ndaId; seed records)
EDIT src/components/gp/GpSidebar.tsx      (add "NDAs" entry)
EDIT src/App.tsx                          (add /ndas and /nda/:ndaId routes)
EDIT src/pages/gp/raise/RaisePipeline.tsx (NDA column, actions, drawer)
EDIT src/components/gp/ShareRaiseModal.tsx(wire NDA creation on send)
ADD  jspdf dependency
```

## Out of scope (for this build)
- Real auth on the LP sign page (open link by id, mock only)
- Server-side audit log / IP capture (mocked)
- Multi-party / sequential signing (single-party LP, optional GP countersign)
- Template editor UI (single default template; upload later)
