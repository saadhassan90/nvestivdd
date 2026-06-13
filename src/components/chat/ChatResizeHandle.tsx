import { useChatContext } from "@/contexts/ChatContext";

/**
 * Drag-to-resize handle for any chat column.
 * Anchored to the right edge of its parent (parent must be `relative`).
 * Clamps width between 360px and 50vw.
 */
export function ChatResizeHandle() {
  const { setChatWidth } = useChatContext();

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const parent = (e.currentTarget as HTMLElement).parentElement;
    const startX = e.clientX;
    const startWidth = parent?.offsetWidth ?? 480;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const maxW = Math.round(window.innerWidth * 0.5);
      const next = Math.min(Math.max(360, startWidth + delta), maxW);
      setChatWidth(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onMouseDown={startResize}
      title="Drag to resize"
      className="group absolute right-0 top-0 bottom-0 z-50 w-1.5 translate-x-1/2 cursor-col-resize"
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-1 rounded-full bg-border group-hover:bg-foreground/40 transition-colors" />
    </div>
  );
}