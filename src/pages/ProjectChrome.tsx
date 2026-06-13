import { Outlet } from "react-router-dom";
import { ProjectRailProvider, useProjectRailState } from "@/contexts/ProjectRailContext";
import { ProjectStageRail } from "@/components/project/ProjectStageRail";

/**
 * Persistent shell for all `/project/:id/*` routes. The stage rail lives here
 * and stays mounted across navigation — pages register their rail config via
 * `useSetProjectRail`. The page-specific TopBar still lives inside each page
 * because its props are heavily page-specific.
 */
function ProjectChromeInner() {
  const rail = useProjectRailState();
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {rail && (
        <ProjectStageRail
          reportLevel={rail.reportLevel}
          onReportLevelChange={rail.onReportLevelChange}
          bookmarks={rail.bookmarks}
          sectionBookmarks={rail.sectionBookmarks}
          zoom={rail.zoom}
        />
      )}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default function ProjectChrome() {
  return (
    <ProjectRailProvider>
      <ProjectChromeInner />
    </ProjectRailProvider>
  );
}