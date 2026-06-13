import { useCallback, useState } from "react";

const ZOOM_STEPS = [0.75, 0.85, 1.0, 1.15, 1.3, 1.5, 1.75] as const;

export interface ReportZoomControls {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  canIn: boolean;
  canOut: boolean;
}

export function useReportZoom(initial = 1): ReportZoomControls {
  const [zoom, setZoom] = useState(initial);
  const zoomIn = useCallback(
    () => setZoom((z) => ZOOM_STEPS.find((s) => s > z + 0.001) ?? z),
    [],
  );
  const zoomOut = useCallback(
    () => setZoom((z) => [...ZOOM_STEPS].reverse().find((s) => s < z - 0.001) ?? z),
    [],
  );
  const reset = useCallback(() => setZoom(1), []);
  return {
    zoom,
    zoomIn,
    zoomOut,
    reset,
    canIn: zoom < ZOOM_STEPS[ZOOM_STEPS.length - 1] - 0.001,
    canOut: zoom > ZOOM_STEPS[0] + 0.001,
  };
}