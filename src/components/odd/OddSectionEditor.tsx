import { useEffect, useMemo } from "react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "@/components/memo/ic-memo-canvas.css";
import "./odd-section-editor.css";
import {
  animatedChartBlockSpec,
  postProcessChartBlocks,
} from "@/components/memo/blocks/AnimatedChartBlock";

interface OddSectionEditorProps {
  /** Markdown seed for this section's body (no H2 — header rendered outside). */
  seedMarkdown: string;
  /** Stable key so the editor remounts/re-seeds when the underlying section changes. */
  resetKey: string;
  onChange?: (markdown: string) => void;
}

/**
 * Single-section BlockNote editor for the ODD report. Mirrors the L3 IC memo
 * canvas styling but is scoped to one section's body content.
 */
export function OddSectionEditor({ seedMarkdown, resetKey, onChange }: OddSectionEditorProps) {
  const schema = useMemo(
    () =>
      BlockNoteSchema.create({
        blockSpecs: { ...defaultBlockSpecs, animatedChart: animatedChartBlockSpec },
      }),
    [],
  );

  const editor = useCreateBlockNote(
    {
      schema,
      defaultStyles: false,
      domAttributes: {
        editor: { class: "ic-memo-editor-root" },
        blockContent: { class: "ic-memo-block-content" },
        inlineContent: { class: "ic-memo-inline-content" },
      },
      heading: { levels: [1, 2, 3, 4, 5] },
    },
    [resetKey],
  );

  useEffect(() => {
    let cancelled = false;
    async function seed() {
      if (!editor) return;
      const blocks = await editor.tryParseMarkdownToBlocks(seedMarkdown || "");
      const processed = postProcessChartBlocks(blocks);
      if (!cancelled && processed.length > 0) {
        editor.replaceBlocks(editor.document, processed);
      }
    }
    seed();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, resetKey]);

  return (
    <div className="ic-memo-canvas odd-section-canvas -mx-3">
      <BlockNoteView
        editor={editor}
        theme="light"
        className="ic-memo-editor-shell"
        onChange={async () => {
          if (!onChange) return;
          const md = await editor.blocksToMarkdownLossy(editor.document);
          onChange(md);
        }}
      />
    </div>
  );
}