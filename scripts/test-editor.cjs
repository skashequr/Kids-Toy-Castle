/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html><body><div id=editor></div></body>", { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.HTMLElement = dom.window.HTMLElement;
global.MutationObserver = dom.window.MutationObserver;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = clearTimeout;

function load(file, resolve = require) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: resolve, window, document, console });
  return exports;
}
const format = load("src/lib/rich-text.ts");
const component = load("src/components/ui/rich-text.tsx", (name) => {
  if (name === "@/lib/rich-text") return format;
  if (name === "@/lib/utils") return { cn: (...values) => values.join(" ") };
  return require(name);
});
const { Editor } = require("@tiptap/react");
const { closeHistory } = require("@tiptap/pm/history");
const editor = new Editor({ element: document.getElementById("editor"), extensions: component.richTextExtensions(), content: "<p>বাংলা text</p>" });
editor.commands.selectAll();
editor.chain().setFontFamily("var(--font-hind-siliguri)").setFontSize("14pt").toggleBold().run();
assert.equal(editor.getAttributes("textStyle").fontSize, "14pt");
assert.equal(editor.isActive("bold"), true);
editor.view.dispatch(closeHistory(editor.state.tr));
editor.commands.setFontSize("22pt");
assert.equal(editor.getAttributes("textStyle").fontSize, "22pt");
assert.equal(editor.commands.undo(), true);
assert.equal(editor.getAttributes("textStyle").fontSize, "14pt", "undo must restore the exact prior size");
assert.equal(editor.commands.redo(), true);
assert.equal(editor.getAttributes("textStyle").fontSize, "22pt");
const saved = format.saveRichTextDocument(editor.getJSON());
editor.commands.setContent(format.readRichTextDocument(saved));
editor.commands.selectAll();
assert.equal(editor.getAttributes("textStyle").fontSize, "22pt", "reopen must retain exact points");
assert.equal(editor.getAttributes("textStyle").fontFamily, "var(--font-hind-siliguri)");
assert.equal(editor.isActive("bold"), true);
editor.chain().unsetAllMarks().clearNodes().run();
assert.equal(editor.isActive("bold"), false);
assert.equal(editor.getAttributes("textStyle").fontSize, undefined, "clear formatting must remove font size");
editor.commands.setTextSelection(1);
editor.chain().setFontSize("8pt").insertContent("ছোট ").run();
assert.match(format.richTextToHtml(format.saveRichTextDocument(editor.getJSON())), /font-size:8pt/);
editor.commands.selectAll();
editor.commands.toggleBulletList();
assert.equal(editor.getJSON().content[0].type, "bulletList");
editor.commands.setTextSelection(3);
assert.equal(editor.isActive("bulletList"), true, JSON.stringify(editor.getJSON()));
assert.match(format.richTextToHtml(format.saveRichTextDocument(editor.getJSON())), /<ul><li>/);
editor.commands.setContent(format.richTextToHtml("[[font:hind:12]]**পুরনো লেখা**[[/font]]"));
editor.commands.selectAll();
assert.equal(editor.getAttributes("textStyle").fontSize, "12pt", "legacy font descriptions must import correctly");
assert.equal(editor.isActive("bold"), true);
editor.commands.setContent('<p><span style="font-size:80px;font-family:Arial">Pasted Word text</span></p>');
editor.commands.selectAll();
assert.equal(editor.getAttributes("textStyle").fontSize, "22pt", "pasted sizes must stay within the allowed range");
assert.equal(editor.getAttributes("textStyle").fontFamily, "Arial");
editor.commands.clearContent();
assert.equal(format.saveRichTextDocument(editor.getJSON()), "");
editor.destroy();
dom.window.close();
console.log("Actual editor selection, size, font, undo/redo, clear formatting, typing, lists and reopen checks passed.");
