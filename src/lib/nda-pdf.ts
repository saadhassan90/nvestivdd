import jsPDF from "jspdf";
import type { NdaRecord } from "@/mocks/gp/ndas";
import { getTemplate, NDA_STATUS_META } from "@/mocks/gp/ndas";

function fmt(ts?: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

export function generateNdaPdf(nda: NdaRecord): jsPDF {
  const tpl = getTemplate(nda.templateId);
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 56;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = margin;

  const writeWrapped = (text: string, size: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, pageW - margin * 2);
    for (const line of lines) {
      if (y > pageH - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += size + 4;
    }
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(tpl?.name ?? "Non-Disclosure Agreement", margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`Raise: ${nda.raiseName}   ·   NDA ID: ${nda.id}`, margin, y);
  y += 12;
  doc.text(`Status: ${NDA_STATUS_META[nda.status].label}`, margin, y);
  y += 18;
  doc.setTextColor(0);

  // Body
  const body = (tpl?.bodyMd ?? "").replace(/{{date}}/g, fmt(nda.createdAt));
  for (const block of body.split(/\n\n+/)) {
    if (block.startsWith("# ")) {
      writeWrapped(block.replace(/^#\s+/, ""), 14, true);
      y += 4;
    } else if (block.startsWith("## ")) {
      y += 6;
      writeWrapped(block.replace(/^##\s+/, ""), 11, true);
    } else {
      writeWrapped(block.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\n/g, " "), 10);
      y += 4;
    }
  }

  // Signature block
  if (y > pageH - 220) { doc.addPage(); y = margin; }
  y += 14;
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Recipient Signature", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${nda.signerName ?? "—"}`, margin, y); y += 13;
  doc.text(`Title: ${nda.signerTitle ?? "—"}`, margin, y); y += 13;
  doc.text(`Email: ${nda.lpEmail}`, margin, y); y += 13;
  doc.text(`Signed: ${fmt(nda.signedAt)}`, margin, y); y += 13;
  doc.text(`IP: ${nda.ipAddress ?? "—"}`, margin, y); y += 16;

  if (nda.signatureDataUrl) {
    try {
      doc.addImage(nda.signatureDataUrl, "PNG", margin, y, 220, 60);
      y += 64;
    } catch { /* noop */ }
  }

  if (nda.countersignedAt) {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Countersigned by Fund", margin, y); y += 13;
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${fmt(nda.countersignedAt)}`, margin, y); y += 13;
  }

  // Audit trail
  doc.addPage(); y = margin;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text("Audit Trail", margin, y); y += 18;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  for (const e of nda.auditTrail) {
    const line = `${fmt(e.ts)}  ·  ${e.actor}  ·  ${e.event}`;
    if (y > pageH - margin) { doc.addPage(); y = margin; }
    doc.text(line, margin, y);
    y += 12;
  }

  return doc;
}

export function downloadNdaPdf(nda: NdaRecord) {
  const doc = generateNdaPdf(nda);
  const safe = nda.lpName.replace(/[^a-z0-9]+/gi, "_");
  doc.save(`NDA_${safe}_${nda.id}.pdf`);
}