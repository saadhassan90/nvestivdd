import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreHorizontal } from "lucide-react";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { NewRaiseModal } from "@/components/gp/NewRaiseModal";
import { RAISES, overallCompletion, subscribeRaises, deleteRaise } from "@/mocks/gp/raises";
import { EditableText } from "@/components/iris/EditableText";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RaisesList() {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => subscribeRaises(() => force((n) => n + 1)), []);

  const pendingName = RAISES.find((r) => r.id === confirmDelete)?.name;

  return (
    <>
      <GpPagePlaceholder
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3.5 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Raise
          </button>
        }
      >
        <div className="mb-6">
          <EditableText
            as="h1"
            className="text-2xl font-semibold text-foreground"
            sectionKey="title"
            label="Page title"
            schema="text"
            defaultValue="Raises"
          />
          <EditableText
            as="p"
            className="text-sm text-muted-foreground mt-1.5 max-w-2xl"
            sectionKey="description"
            label="Page description"
            defaultValue="One record per raise. GPs may run several simultaneously."
          />
        </div>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Name</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
                <th className="text-left font-medium px-4 py-2.5">Strategy</th>
                <th className="text-left font-medium px-4 py-2.5">Target</th>
                <th className="text-left font-medium px-4 py-2.5 w-[180px]">Completion</th>
                <th className="text-right font-medium px-4 py-2.5">LPs</th>
                <th className="text-right font-medium px-4 py-2.5">DDQ</th>
                <th className="w-10 px-2" />
              </tr>
            </thead>
            <tbody>
              {RAISES.map((r) => {
                const pct = overallCompletion(r);
                return (
                  <tr
                    key={r.id}
                    className="border-t border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/raises/${r.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.strategy}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.targetSize}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-foreground/70" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{r.lps.length}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{r.ddq.length}</td>
                    <td className="px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            aria-label="Open menu"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => navigate(`/raises/${r.id}`)}>
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/raises/${r.id}/feedback`)}>
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/raises/${r.id}/report-card`)}>
                            IRIS Report
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setConfirmDelete(r.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {RAISES.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No raises yet. Click “New Raise” to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GpPagePlaceholder>
      <NewRaiseModal open={open} onClose={() => setOpen(false)} />
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this raise?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingName ? `“${pendingName}” will be removed from the list.` : null} This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) deleteRaise(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}