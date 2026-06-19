import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  addFiles,
  createFolder,
  deleteNode,
  getChildren,
  getFs,
  getPath,
  renameNode,
  subscribeFs,
  type FsFile,
  type FsFolder,
} from "@/mocks/gp/dataroomFs";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

interface TreeNodeProps {
  raiseId: string;
  folder: FsFolder;
  level: number;
  currentId: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

function TreeNode({ raiseId, folder, level, currentId, expanded, onToggle, onSelect }: TreeNodeProps) {
  const { folders } = getChildren(raiseId, folder.id);
  const isOpen = expanded.has(folder.id);
  const isActive = currentId === folder.id;
  const hasChildren = folders.length > 0;
  return (
    <div>
      <button
        onClick={() => { onSelect(folder.id); if (hasChildren) onToggle(folder.id); }}
        className={cn(
          "w-full flex items-center gap-1 rounded-md px-1.5 py-1 text-left text-sm transition-colors",
          isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
        style={{ paddingLeft: 6 + level * 12 }}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 transition-transform",
            hasChildren ? "opacity-70" : "opacity-0",
            isOpen && "rotate-90"
          )}
        />
        {isOpen && hasChildren ? (
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <Folder className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">{folder.name}</span>
      </button>
      {isOpen && hasChildren && (
        <div>
          {folders.map((c) => (
            <TreeNode
              key={c.id}
              raiseId={raiseId}
              folder={c}
              level={level + 1}
              currentId={currentId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RaiseDataroom() {
  const { fundId } = useParams();
  const raiseId = fundId || "";
  const [, force] = useState(0);
  useEffect(() => subscribeFs(() => force((n) => n + 1)), []);

  const [currentId, setCurrentId] = useState<string>("root");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["root"]));
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure tree initialised
  getFs(raiseId);

  const rootNode = { kind: "folder" as const, id: "root", name: "Data Room", parentId: null, createdAt: "", createdBy: "" };
  const { folders, files } = getChildren(raiseId, currentId);
  const path = getPath(raiseId, currentId);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const openFolder = (id: string) => {
    setCurrentId(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      // expand ancestors
      let cur: FsFolder | undefined = getFs(raiseId).folders.find((f) => f.id === id);
      while (cur) {
        next.add(cur.id);
        cur = cur.parentId ? getFs(raiseId).folders.find((f) => f.id === cur!.parentId) : undefined;
      }
      return next;
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const created = createFolder(raiseId, currentId, newFolderName);
    setNewFolderName("");
    setNewFolderOpen(false);
    setExpanded((prev) => new Set(prev).add(currentId));
    setCurrentId(created.id);
  };

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    const items = Array.from(list).map((f) => ({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)) }));
    addFiles(raiseId, currentId, items);
    e.target.value = "";
  };

  const handleRename = () => {
    if (!renameTarget) return;
    renameNode(raiseId, renameTarget.id, renameValue);
    setRenameTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (currentId === deleteTarget.id) {
      // move to parent
      const fs = getFs(raiseId);
      const node = fs.folders.find((f) => f.id === deleteTarget.id);
      if (node?.parentId) setCurrentId(node.parentId);
    }
    deleteNode(raiseId, deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <GpPagePlaceholder>
      <div className="grid grid-cols-[170px_1fr] gap-5 min-h-[500px]">
        {/* Folder tree side pane */}
        <aside className="border-r border-border pr-2 py-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          <div className="flex items-center justify-between px-1.5 py-1 mb-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Folders</p>
            <button
              onClick={() => setNewFolderOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="New folder"
              title="New folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>
          <TreeNode
            raiseId={raiseId}
            folder={rootNode}
            level={0}
            currentId={currentId}
            expanded={expanded}
            onToggle={toggle}
            onSelect={(id) => setCurrentId(id)}
          />
        </aside>

        {/* Main listing */}
        <section className="min-w-0">
          {/* Breadcrumbs + actions */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <nav className="flex items-center gap-1 text-sm min-w-0 overflow-x-auto">
              {path.map((p, i) => (
                <div key={p.id} className="flex items-center gap-1 shrink-0">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <button
                    onClick={() => setCurrentId(p.id)}
                    className={cn(
                      "px-1.5 py-0.5 rounded hover:bg-muted transition-colors truncate max-w-[200px]",
                      i === path.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {p.name}
                  </button>
                </div>
              ))}
            </nav>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setNewFolderOpen(true)}
                title="New folder"
                aria-label="New folder"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={handleUploadClick}
                title="Upload files"
                aria-label="Upload files"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesPicked} />
            </div>
          </div>

          {/* Listing */}
          <div>
            <div className="grid grid-cols-[1fr_140px_40px] text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-2 border-b border-border">
              <div>Name</div><div>Modified</div><div />
            </div>
            {folders.length === 0 && files.length === 0 && (
              <div className="px-4 py-16 text-center text-sm text-muted-foreground border-b border-border">
                This folder is empty. Use “Upload” or “New folder” to add items.
              </div>
            )}
            {folders.map((f) => (
              <div
                key={f.id}
                className="grid grid-cols-[1fr_140px_40px] items-center px-2 py-2.5 border-b border-border/60 hover:bg-muted/40 text-sm cursor-pointer rounded-sm"
                onDoubleClick={() => openFolder(f.id)}
                onClick={() => openFolder(f.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate text-foreground font-medium">{f.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">{f.createdAt ? formatDate(f.createdAt) : "—"}</div>
                <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
                  <NodeMenu
                    onRename={() => { setRenameValue(f.name); setRenameTarget({ id: f.id, name: f.name }); }}
                    onDelete={() => setDeleteTarget({ id: f.id, name: f.name })}
                  />
                </div>
              </div>
            ))}
            {files.map((f) => (
              <div
                key={f.id}
                className="grid grid-cols-[1fr_140px_40px] items-center px-2 py-2.5 border-b border-border/60 hover:bg-muted/40 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate text-foreground">{f.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1 py-0.5 shrink-0">
                    v{f.version}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(f.uploadedAt)}</div>
                <div className="flex justify-end">
                  <NodeMenu
                    onRename={() => { setRenameValue(f.name); setRenameTarget({ id: f.id, name: f.name }); }}
                    onDelete={() => setDeleteTarget({ id: f.id, name: f.name })}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {folders.length} folder{folders.length === 1 ? "" : "s"} · {files.length} file{files.length === 1 ? "" : "s"}
          </p>
        </section>
      </div>

      {/* New folder dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Create a folder inside <span className="text-foreground font-medium">{path[path.length - 1]?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNewFolderOpen(false); setNewFolderName(""); }}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also remove any files and subfolders inside it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GpPagePlaceholder>
  );
}

function NodeMenu({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Open menu"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={onRename}>
          <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
