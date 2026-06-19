import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUiVariant } from "@/contexts/UiVariantContext";

const GP_ROOTS = ["/chat", "/raises", "/pipeline", "/contacts", "/settings"];
const LP_ROOTS = ["/dashboard", "/project", "/notifications"];

function isGpPath(p: string) {
  return GP_ROOTS.some((r) => p === r || p.startsWith(r + "/"));
}
function isLpPath(p: string) {
  return LP_ROOTS.some((r) => p === r || p.startsWith(r + "/"));
}

/**
 * Watches UiVariant changes. When the user flips into/out of GP mode,
 * redirect to the matching default home if the current route doesn't
 * belong to the new role's surface.
 */
export function ModeRedirector() {
  const { variant } = useUiVariant();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const prev = useRef(variant);

  useEffect(() => {
    const changed = prev.current !== variant;
    prev.current = variant;
    if (variant === "gp") {
      if (changed || isLpPath(pathname) || pathname === "/") {
        navigate("/chat", { replace: true });
      }
    } else {
      if (changed || isGpPath(pathname) || pathname === "/") {
        navigate("/dashboard", { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  return null;
}