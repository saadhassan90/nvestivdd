import { RAISES, type DataroomFile } from "./raises";

export type FsNode = FsFolder | FsFile;

export interface FsFolder {
  kind: "folder";
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  createdBy: string;
}

export interface FsFile {
  kind: "file";
  id: string;
  name: string;
  parentId: string;
  sizeKb: number;
  version: number;
  uploadedAt: string;
  uploadedBy: string;
  category?: DataroomFile["category"];
}

interface RaiseFs {
  folders: FsFolder[];
  files: FsFile[];
}

const trees = new Map<string, RaiseFs>();
const listeners = new Set<() => void>();

function seed(raiseId: string): RaiseFs {
  const raise = RAISES.find((r) => r.id === raiseId);
  const fs: RaiseFs = { folders: [], files: [] };
  const now = new Date().toISOString();
  // Root folder
  fs.folders.push({ kind: "folder", id: "root", name: "Data Room", parentId: null, createdAt: now, createdBy: "System" });
  if (!raise) return fs;
  const categories = Array.from(new Set(raise.dataroom.map((f) => f.category)));
  for (const cat of categories) {
    const fid = `cat-${cat.toLowerCase().replace(/\s+/g, "-")}`;
    fs.folders.push({ kind: "folder", id: fid, name: cat, parentId: "root", createdAt: now, createdBy: "System" });
  }
  for (const f of raise.dataroom) {
    const fid = `cat-${f.category.toLowerCase().replace(/\s+/g, "-")}`;
    fs.files.push({
      kind: "file",
      id: f.id,
      name: f.name,
      parentId: fid,
      sizeKb: f.sizeKb,
      version: f.version,
      uploadedAt: f.uploadedAt,
      uploadedBy: f.uploadedBy,
      category: f.category,
    });
  }
  return fs;
}

export function getFs(raiseId: string): RaiseFs {
  let fs = trees.get(raiseId);
  if (!fs) {
    fs = seed(raiseId);
    trees.set(raiseId, fs);
  }
  return fs;
}

export function subscribeFs(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
function emit() { listeners.forEach((f) => f()); }

let counter = 1000;
function nextId(prefix: string) { counter += 1; return `${prefix}-${counter}`; }

export function getChildren(raiseId: string, folderId: string): { folders: FsFolder[]; files: FsFile[] } {
  const fs = getFs(raiseId);
  return {
    folders: fs.folders.filter((f) => f.parentId === folderId).sort((a, b) => a.name.localeCompare(b.name)),
    files: fs.files.filter((f) => f.parentId === folderId).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function getFolder(raiseId: string, folderId: string): FsFolder | undefined {
  return getFs(raiseId).folders.find((f) => f.id === folderId);
}

export function getPath(raiseId: string, folderId: string): FsFolder[] {
  const fs = getFs(raiseId);
  const out: FsFolder[] = [];
  let cur: FsFolder | undefined = fs.folders.find((f) => f.id === folderId);
  while (cur) {
    out.unshift(cur);
    cur = cur.parentId ? fs.folders.find((f) => f.id === cur!.parentId) : undefined;
  }
  return out;
}

export function createFolder(raiseId: string, parentId: string, name: string): FsFolder {
  const fs = getFs(raiseId);
  const folder: FsFolder = {
    kind: "folder",
    id: nextId("fld"),
    name: name.trim() || "Untitled folder",
    parentId,
    createdAt: new Date().toISOString(),
    createdBy: "You",
  };
  fs.folders.push(folder);
  emit();
  return folder;
}

export function addFiles(raiseId: string, parentId: string, files: { name: string; sizeKb: number }[]): FsFile[] {
  const fs = getFs(raiseId);
  const now = new Date().toISOString();
  const added: FsFile[] = files.map((f) => ({
    kind: "file",
    id: nextId("file"),
    name: f.name,
    parentId,
    sizeKb: f.sizeKb,
    version: 1,
    uploadedAt: now,
    uploadedBy: "You",
  }));
  fs.files.push(...added);
  emit();
  return added;
}

export function renameNode(raiseId: string, id: string, name: string): void {
  const fs = getFs(raiseId);
  const folder = fs.folders.find((f) => f.id === id);
  if (folder && id !== "root") { folder.name = name.trim() || folder.name; emit(); return; }
  const file = fs.files.find((f) => f.id === id);
  if (file) { file.name = name.trim() || file.name; emit(); }
}

export function deleteNode(raiseId: string, id: string): void {
  if (id === "root") return;
  const fs = getFs(raiseId);
  // collect descendant folder ids
  const toDelete = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of fs.folders) {
      if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
        toDelete.add(f.id);
        changed = true;
      }
    }
  }
  fs.folders = fs.folders.filter((f) => !toDelete.has(f.id));
  fs.files = fs.files.filter((f) => !toDelete.has(f.id) && !toDelete.has(f.parentId));
  emit();
}
