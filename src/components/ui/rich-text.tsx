"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import { Bold, Eraser, Highlighter, Italic, List, ListOrdered, Redo2, Underline, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FONTS, FONT_SIZES, richTextToHtml, readRichTextDocument, saveRichTextDocument,
  normalizeFontFamily, normalizeFontSize,
} from "@/lib/rich-text";

export { richTextToHtml, richTextToPlainText } from "@/lib/rich-text";

export function richTextExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] }, link: false, code: false,
      codeBlock: false, blockquote: false, horizontalRule: false,
      trailingNode: false,
    }),
    TextStyle,
    FontFamily.extend({
      addGlobalAttributes() {
        return [{ types: ["textStyle"], attributes: { fontFamily: {
          default: null,
          parseHTML: (element: HTMLElement) => normalizeFontFamily(element.style.fontFamily),
          renderHTML: (attributes: Record<string, unknown>) => {
            const family = normalizeFontFamily(attributes.fontFamily);
            return family ? { style: `font-family:${family}` } : {};
          },
        } } }];
      },
    }),
    FontSize.extend({
      addGlobalAttributes() {
        return [{ types: ["textStyle"], attributes: { fontSize: {
          default: null,
          parseHTML: (element: HTMLElement) => normalizeFontSize(element.style.fontSize),
          renderHTML: (attributes: Record<string, unknown>) => {
            const size = normalizeFontSize(attributes.fontSize);
            return size ? { style: `font-size:${size}` } : {};
          },
        } } }];
      },
    }),
    Highlight,
  ];
}

type EditorProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  minHeight?: string;
};

const tools = [
  { label: "Bold", icon: Bold, mark: "bold", run: (editor: Editor) => editor.chain().focus().toggleBold().run() },
  { label: "Italic", icon: Italic, mark: "italic", run: (editor: Editor) => editor.chain().focus().toggleItalic().run() },
  { label: "Underline", icon: Underline, mark: "underline", run: (editor: Editor) => editor.chain().focus().toggleUnderline().run() },
  { label: "Highlight", icon: Highlighter, mark: "highlight", run: (editor: Editor) => editor.chain().focus().toggleHighlight().run() },
  { label: "Bullet list", icon: List, mark: "bulletList", run: (editor: Editor) => editor.chain().focus().toggleBulletList().run() },
  { label: "Numbered list", icon: ListOrdered, mark: "orderedList", run: (editor: Editor) => editor.chain().focus().toggleOrderedList().run() },
  { label: "Undo", icon: Undo2, mark: "", run: (editor: Editor) => editor.chain().focus().undo().run() },
  { label: "Redo", icon: Redo2, mark: "", run: (editor: Editor) => editor.chain().focus().redo().run() },
  { label: "Clear formatting", icon: Eraser, mark: "", run: (editor: Editor) => editor.chain().focus().unsetAllMarks().clearNodes().run() },
] as const;

export function RichTextEditor({
  value, onChange, label = "Description", required,
  placeholder = "Write a description…", minHeight = "min-h-40",
}: EditorProps) {
  const lastValue = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: richTextExtensions(),
    content: readRichTextDocument(value) ?? richTextToHtml(value),
    editorProps: {
      attributes: {
        class: cn("rich-text-editor w-full px-4 py-3 leading-7 text-[#24445b] outline-none", minHeight),
        role: "textbox", "aria-label": label, "aria-multiline": "true",
        "aria-required": String(Boolean(required)), "data-placeholder": placeholder,
        style: "font-size:11pt;font-family:var(--font-editor-default)",
      },
    },
    onUpdate: ({ editor: current }) => {
      const next = saveRichTextDocument(current.getJSON());
      lastValue.current = next;
      onChangeRef.current(next);
    },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      font: String(current?.getAttributes("textStyle").fontFamily ?? ""),
      size: String(current?.getAttributes("textStyle").fontSize ?? "11pt"),
      block: current?.isActive("heading", { level: 2 }) ? "h2" : current?.isActive("heading", { level: 3 }) ? "h3" : "p",
      active: tools.map((tool) => Boolean(tool.mark && current?.isActive(tool.mark))),
      undo: Boolean(current?.can().undo()),
      redo: Boolean(current?.can().redo()),
      empty: current?.isEmpty ?? true,
    }),
  });

  useEffect(() => {
    if (!editor || value === lastValue.current) return;
    editor.commands.setContent(readRichTextDocument(value) ?? richTextToHtml(value), { emitUpdate: false });
    lastValue.current = value;
  }, [editor, value]);

  const selectedFont = FONTS.find((font) => font.family === state?.font)?.id ?? "default";
  const points = Number.parseFloat(state?.size ?? "11pt") * (state?.size.endsWith("px") ? 0.75 : 1);
  const selectedSize = Number.isFinite(points) ? Math.min(22, Math.max(8, Math.round(points))) : 11;
  const controlClass = "h-9 rounded-lg border border-[#d8e8f2] bg-white px-2 text-sm text-[#526f84] disabled:opacity-50";

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-[#527087]">{label}{required ? " *" : ""}</p>
      <div className="overflow-hidden rounded-2xl border border-[#d8e8f2] bg-white focus-within:border-[#238fda] focus-within:ring-4 focus-within:ring-[#238fda]/10">
        <div role="toolbar" aria-label={label + " formatting"} className="flex flex-wrap items-center gap-1 border-b border-[#e5eff5] bg-[#f7fbfe] p-2">
          <select aria-label="Font family" value={selectedFont} disabled={!editor} className={cn(controlClass, "max-w-44")}
            onChange={(event) => {
              const font = FONTS.find((item) => item.id === event.target.value);
              if (font && editor) editor.chain().focus().setFontFamily(font.family).run();
            }}>
            {FONTS.map((font) => <option key={font.id} value={font.id}>{font.label}</option>)}
          </select>
          <select aria-label="Font size in points" value={selectedSize} disabled={!editor} className={controlClass}
            onChange={(event) => editor?.chain().focus().setFontSize(event.target.value + "pt").run()}>
            {FONT_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <span className="mr-1 text-xs text-[#7892a5]">pt</span>
          <select aria-label="Paragraph style" value={state?.block ?? "p"} disabled={!editor} className={controlClass}
            onChange={(event) => {
              if (!editor) return;
              if (event.target.value === "p") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().setHeading({ level: event.target.value === "h2" ? 2 : 3 }).run();
            }}>
            <option value="p">Normal</option><option value="h3">Heading 3</option><option value="h2">Heading 2</option>
          </select>
          <span className="mx-1 h-6 w-px bg-[#d8e8f2]" />
          {tools.map((tool, index) => <button
            key={tool.label} type="button" aria-label={tool.label} title={tool.label}
            aria-pressed={tool.mark ? state?.active[index] ?? false : undefined}
            disabled={!editor || (tool.label === "Undo" && !state?.undo) || (tool.label === "Redo" && !state?.redo)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => { if (editor) tool.run(editor); }}
            className={cn("flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#e2f4ff] disabled:opacity-40", state?.active[index] ? "bg-[#dff3ff] text-[#238fda]" : "text-[#526f84]")}
          ><tool.icon className="h-4 w-4" /></button>)}
        </div>
        {editor ? <div className="relative">
          <EditorContent editor={editor} />
          {state?.empty && <span aria-hidden="true" className="pointer-events-none absolute left-4 top-3 text-sm text-[#7892a5]">{placeholder}</span>}
        </div> : <div className={cn("px-4 py-3 text-sm text-[#7892a5]", minHeight)}>Editor loading…</div>}
      </div>
      <p className="mt-2 text-xs text-[#7892a5]">লেখা select করে font ও ৮–২২ point size দিন। Li Ador ডিভাইসে installed থাকলে দেখাবে; না থাকলে Hind Siliguri ব্যবহার হবে।</p>
    </div>
  );
}

export function RichTextContent({ value, className }: { value: string; className?: string }) {
  return <div className={cn(
    "rich-text-content space-y-3 break-words leading-7 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_mark]:rounded [&_mark]:bg-[#fff0a8] [&_mark]:px-0.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6",
    className,
  )} dangerouslySetInnerHTML={{ __html: richTextToHtml(value) }} />;
}
