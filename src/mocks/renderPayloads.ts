import { flagshipPayload } from "./flagshipPayload";
import { buildPayload } from "./buildPayload";
import type { RenderPayload } from "@/types/renderContract";

interface FundSeed {
  id: string;
  name: string;
  assetClass?: string;
  composite?: number;
}

const FUNDS: FundSeed[] = [
  { id: "549639c9-6a33-4b6a-b343-9e190701f9c7", name: "Vista Equity Partners IX" }, // FLAGSHIP
  { id: "33333333-3333-3333-3333-333333333333", name: "Castle Hook Partners LP", composite: 84 },
  { id: "11111111-1111-1111-1111-111111111111", name: "Sequoia Heritage IV", composite: 88, assetClass: "Multi-strategy / Endowment Style" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Blackstone RE VII", composite: 79, assetClass: "Real Estate — Opportunistic" },
  { id: "44444444-4444-4444-4444-444444444444", name: "Tiger Global X", composite: 42, assetClass: "Crossover / Late-Stage Venture" },
  { id: "7bd1d3a3-1f9d-43e5-af36-1b89fa73c95c", name: "Altum Credit Fund, Ltd.", composite: 71, assetClass: "Private Credit — Direct Lending" },
  { id: "4e2d795c-3569-476e-80ac-60af1ab18b67", name: "Apollo Crypto Fund", composite: 38, assetClass: "Digital Assets — Liquid" },
  { id: "61090713-3596-4ea4-8e36-d4071930a257", name: "Practical Venture Capital PVC 2", composite: 67, assetClass: "Secondaries — Venture" },
  { id: "55555555-5555-5555-5555-555555555555", name: "HPP/Emergent SMM Opportunity Fund", composite: 73, assetClass: "Small/Mid Manager Seeding" },
  { id: "9a718608-9bad-400c-891e-2b904975f2f5", name: "Brookfield Infrastructure Fund V", composite: 86, assetClass: "Infrastructure — Core+" },
  { id: "c5f39fa0-fd85-4b91-8404-7e641cd19417", name: "KKR Asia Fund IV", composite: 78, assetClass: "Private Equity — Asia Buyout" },
  { id: "eabe1add-1016-456f-a8fe-83ce482f8400", name: "Ares Senior Direct Lending Fund III", composite: 81, assetClass: "Private Credit — Senior" },
  { id: "be305c77-60be-4ea5-ae91-7fcb14337a43", name: "TPG Rise Climate II", composite: 70, assetClass: "Impact / Climate Growth" },
  { id: "cd07b991-c292-4cec-92f2-23a8d4cf030f", name: "Two Sigma Risk Premia Master Fund", composite: 58, assetClass: "Systematic Hedge Fund" },
  { id: "e3f56f03-9d14-41bc-8c39-0f2c263651c9", name: "Carlyle Realty Partners X", composite: 64, assetClass: "Real Estate — Value-Add" },
  { id: "e2e2b4fa-568e-490f-aee9-aa98cbf341f9", name: "Lightspeed India Partners IV", composite: 69, assetClass: "Venture — Emerging Markets" },
  { id: "af000d7a-af0d-4719-aa6d-2b15945f6548", name: "Pantera Blockchain Fund VI", composite: 46, assetClass: "Digital Assets — Venture" },
  { id: "7212cfff-f89d-40a0-a02d-89930575ad7a", name: "Aurora Distressed Opportunities Fund II", composite: 75, assetClass: "Distressed / Special Situations" },
];

const FLAGSHIP_ID = "549639c9-6a33-4b6a-b343-9e190701f9c7";

export const RENDER_PAYLOADS: Record<string, RenderPayload> = Object.fromEntries(
  FUNDS.map((f) => {
    if (f.id === FLAGSHIP_ID) {
      return [f.id, { ...flagshipPayload, meta: { ...flagshipPayload.meta, project_id: f.id } }];
    }
    return [
      f.id,
      buildPayload({
        projectId: f.id,
        fundName: f.name,
        assetClass: f.assetClass,
        forceComposite: f.composite,
      }),
    ];
  }),
);

export function payloadFor(projectId: string, fundName: string): RenderPayload {
  return (
    RENDER_PAYLOADS[projectId] ??
    buildPayload({ projectId, fundName: fundName || "Demo Fund" })
  );
}