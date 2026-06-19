import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { initPageContent, setActivePage } from "@/lib/pageContent";

/**
 * Maps the current URL to a stable (page_key, raise_id) pair and publishes
 * it to the page-content store so the chat backend knows what page Iris is
 * looking at.
 */
function pageKeyForPath(pathname: string): { pageKey: string; raiseId: string | null } {
  // /raises/:fundId/<tab>?
  const raiseMatch = pathname.match(/^\/raises\/([^/]+)(?:\/([^/]+))?\/?$/);
  if (raiseMatch) {
    const raiseId = raiseMatch[1];
    const tab = raiseMatch[2];
    const tabMap: Record<string, string> = {
      dataroom: "gp.raise.dataroom",
      ddq: "gp.raise.ddq",
      interview: "gp.raise.interview",
      "report-card": "gp.raise.report-card",
      feedback: "gp.raise.feedback",
      pipeline: "gp.raise.pipeline",
    };
    return { pageKey: tab ? tabMap[tab] || "gp.raise.overview" : "gp.raise.overview", raiseId };
  }
  if (pathname.startsWith("/raises")) return { pageKey: "gp.raises.list", raiseId: null };
  if (pathname.startsWith("/pipeline")) return { pageKey: "gp.pipeline", raiseId: null };
  if (pathname.startsWith("/contacts")) return { pageKey: "gp.contacts", raiseId: null };
  if (pathname.startsWith("/settings")) return { pageKey: "gp.settings", raiseId: null };
  if (pathname.startsWith("/chat")) return { pageKey: "gp.chat", raiseId: null };
  return { pageKey: "gp.unknown", raiseId: null };
}

export function PageContextSync() {
  const { pathname } = useLocation();
  // Touch useParams so re-renders happen on nested route changes too.
  useParams();

  useEffect(() => {
    initPageContent();
  }, []);

  useEffect(() => {
    const { pageKey, raiseId } = pageKeyForPath(pathname);
    setActivePage(pageKey, raiseId);
  }, [pathname]);

  return null;
}