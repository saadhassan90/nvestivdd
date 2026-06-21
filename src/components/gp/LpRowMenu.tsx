import { MoreHorizontal, Eye, Send, RotateCw, CheckCircle2, Ban, Download, UserMinus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  countersignNda,
  getNdaByLp,
  revokeNda,
  sendNda,
  subscribeNdas,
  type NdaRecord,
} from "@/mocks/gp/ndas";
import { downloadNdaPdf } from "@/lib/nda-pdf";
import { useEffect, useState } from "react";

interface Props {
  raiseId: string;
  raiseName: string;
  lpId: string;
  lpName: string;
  onViewNda?: (nda: NdaRecord) => void;
  onSendNda?: () => void;
  onDropFromPipeline?: () => void;
}

export function LpRowMenu({
  raiseId,
  lpId,
  lpName,
  onViewNda,
  onSendNda,
  onDropFromPipeline,
}: Props) {
  const [, force] = useState(0);
  useEffect(() => subscribeNdas(() => force((v) => v + 1)), []);

  const nda = getNdaByLp(raiseId, lpId);
  const status = nda?.status;
  const isExecuted = status === "countersigned";
  const isSigned = status === "signed";
  const isPending = status === "sent" || status === "viewed";
  const canSend = !nda || ["not_sent", "expired", "declined", "revoked"].includes(status ?? "not_sent");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {nda ? (
          <DropdownMenuItem onClick={() => onViewNda?.(nda)}>
            <Eye className="h-3.5 w-3.5 mr-2" /> View NDA
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <Eye className="h-3.5 w-3.5 mr-2" /> No NDA yet
          </DropdownMenuItem>
        )}

        {canSend && (
          <DropdownMenuItem onClick={() => onSendNda?.()}>
            <Send className="h-3.5 w-3.5 mr-2" /> Send NDA
          </DropdownMenuItem>
        )}
        {isPending && nda && (
          <DropdownMenuItem
            onClick={() => {
              sendNda(nda.id);
              toast.success("NDA resent", { description: `Sent to ${nda.lpEmail}.` });
            }}
          >
            <RotateCw className="h-3.5 w-3.5 mr-2" /> Resend NDA
          </DropdownMenuItem>
        )}
        {isSigned && nda && (
          <DropdownMenuItem
            onClick={() => {
              countersignNda(nda.id);
              toast.success("NDA countersigned");
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Countersign
          </DropdownMenuItem>
        )}
        {(isSigned || isExecuted) && nda && (
          <DropdownMenuItem onClick={() => downloadNdaPdf(nda)}>
            <Download className="h-3.5 w-3.5 mr-2" /> Download PDF
          </DropdownMenuItem>
        )}

        {nda && status !== "revoked" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                revokeNda(nda.id);
                toast.error("NDA revoked", { description: `Access removed for ${lpName}.` });
              }}
            >
              <Ban className="h-3.5 w-3.5 mr-2" /> Revoke NDA
            </DropdownMenuItem>
          </>
        )}

        {onDropFromPipeline && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDropFromPipeline()}
            >
              <UserMinus className="h-3.5 w-3.5 mr-2" /> Drop from pipeline
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}