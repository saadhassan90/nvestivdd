import { useEffect, useMemo } from "react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "./ic-memo-canvas.css";

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
    () => BlockNoteSchema.create({ blockSpecs: { ...defaultBlockSpecs } }),
    [],
  );

  const editor = useCreateBlockNote(
    {
      schema,
      // Allow all 5 heading levels for the IC memo
      // (BlockNote default is 3; we extend to 5 for finer hierarchy)
      // @ts-expect-error - heading levels accepts array in v0.48+
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
      if (!cancelled && blocks.length > 0) {
        editor.replaceBlocks(editor.document, blocks);
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
        onChange={async () => {
          const json = editor.document;
          const md = await editor.blocksToMarkdownLossy(editor.document);
          onChange(json, md);
        }}
      />
    </div>
  );
}