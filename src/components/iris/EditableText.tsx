import { useEffect, useSyncExternalStore, type ElementType, type ReactNode } from "react";
import {
  getActivePage,
  getBlockValue,
  registerBlock,
  subscribePageContent,
  type SchemaType,
} from "@/lib/pageContent";
import { cn } from "@/lib/utils";

/**
 * Renders a piece of editable prose. Registers itself with the page-content
 * store so Iris can discover and edit it.
 *
 * The current page_key + raise_id come from the active route (set by
 * PageContextSync). Pages just declare a stable `sectionKey` and the
 * fallback text to use when no DB override exists.
 */
export function EditableText({
  sectionKey,
  label,
  defaultValue,
  schema = "markdown",
  as: Tag = "p",
  className,
  children,
}: {
  sectionKey: string;
  label: string;
  defaultValue: string;
  schema?: SchemaType;
  as?: ElementType;
  className?: string;
  /** Optional render override. Receives the live text. */
  children?: (text: string) => ReactNode;
}) {
  const active = useSyncExternalStore(
    subscribePageContent,
    () => `${getActivePage().pageKey}|${getActivePage().raiseId || ""}`,
    () => "",
  );
  const [pageKey, raiseIdRaw] = active.split("|");
  const raiseId = raiseIdRaw || null;

  useEffect(() => {
    if (!pageKey || pageKey === "unknown") return;
    registerBlock({ pageKey, raiseId, sectionKey, label, schema, defaultValue });
  }, [pageKey, raiseId, sectionKey, label, schema, defaultValue]);

  const text = useSyncExternalStore(
    subscribePageContent,
    () => getBlockValue(pageKey, raiseId, sectionKey, defaultValue),
    () => defaultValue,
  );

  if (children) return <>{children(text)}</>;
  return <Tag className={cn(className)}>{text}</Tag>;
}