import { useEffect, useMemo } from "react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "./ic-memo-canvas.css";
import { animatedChartBlockSpec, postProcessChartBlocks } from "./blocks/AnimatedChartBlock";

interface IcMemoCanvasProps {
  /** BlockNote document JSON. If empty, the editor falls back to seedMarkdown. */
  contentJson: any;
  /** Markdown used to seed the editor when contentJson is empty. */
  seedMarkdown: string;
  /** Called (debounced upstream) every time the document changes. */
  onChange: (json: any, markdown: string) => void;
  /** Bumped externally to force re-seed (e.g. realtime update or template reset). */
  resetKey?: string | number;
}

export function IcMemoCanvas({ contentJson, seedMarkdown, onChange, resetKey }: IcMemoCanvasProps) {
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
      // Allow all 5 heading levels for the IC memo (default is 3)
      heading: { levels: [1, 2, 3, 4, 5] },
      initialContent:
        Array.isArray(contentJson) && contentJson.length > 0 ? contentJson : undefined,
    },
    [resetKey],
  );

  // Seed from markdown on first mount or when resetKey changes
  useEffect(() => {
    let cancelled = false;
    async function seed() {
      if (!editor) return;
      const hasJson = Array.isArray(contentJson) && contentJson.length > 0;
      if (hasJson) return;
      const blocks = await editor.tryParseMarkdownToBlocks(seedMarkdown);
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
    <div className="ic-memo-canvas mx-auto w-full max-w-[820px]">
      <BlockNoteView
        editor={editor}
        theme="light"
        className="ic-memo-editor-shell"
        onChange={async () => {
          const json = editor.document;
          const md = await editor.blocksToMarkdownLossy(editor.document);
          onChange(json, md);
        }}
      />
    </div>
  );
}