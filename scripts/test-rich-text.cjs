/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const exportsObject = {};
const source = ts.transpileModule(fs.readFileSync("src/lib/rich-text.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
vm.runInNewContext(source, { exports: exportsObject, require: () => ({}) });
const { richTextToHtml, richTextToPlainText } = exportsObject;
const value = "[[font:hind:8]]বাংলা ছোট[[/font]]\n[[font:ador:22]]**বড় লেখা**[[/font]]";
const html = richTextToHtml(value);
assert.match(html, /font-family:var\(--font-hind-siliguri\);font-size:8pt/);
assert.match(html, /font-family:var\(--font-li-ador\);font-size:22pt/);
assert.match(html, /<strong>বড় লেখা<\/strong>/);
assert.equal(richTextToPlainText(value), "বাংলা ছোট\nবড় লেখা");
assert.equal(richTextToPlainText("[[font:hind:14]][[/font]]"), "");
assert.match(richTextToHtml("- **পুরনো বর্ণনা**\n- *দ্বিতীয় লাইন*"), /<ul><li><strong>পুরনো বর্ণনা<\/strong><\/li>/);
assert.ok(!richTextToHtml("[[font:unknown:999]]<img src=x onerror=alert(1)>[[/font]]").includes("<img"));
assert.ok(!richTextToHtml("[[font:hind:99]]text[[/font]]").includes("99pt"));
const nested = richTextToHtml("[[font:hind:14]]one [[font:ador:22]]two[[/font]] three[[/font]]");
assert.equal((nested.match(/<span/g) ?? []).length, (nested.match(/<\/span>/g) ?? []).length);
console.log("Rich text font, size, backward compatibility and HTML escaping checks passed.");

const { saveRichTextDocument, readRichTextDocument } = exportsObject;
const document = { type: "doc", content: [
  { type: "paragraph", content: [
    { type: "text", text: "বাংলা **literal**", marks: [
      { type: "bold" }, { type: "textStyle", attrs: { fontFamily: "var(--font-hind-siliguri)", fontSize: "14pt" } },
    ] },
    { type: "hardBreak" },
    { type: "text", text: "second line", marks: [{ type: "underline" }] },
  ] },
  { type: "paragraph" },
  { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "list item" }] }] }] },
] };
const saved = saveRichTextDocument(document);
assert.deepEqual(JSON.parse(JSON.stringify(readRichTextDocument(saved))), document);
assert.equal(richTextToPlainText(saved), "বাংলা **literal**\nsecond line\n\nlist item");
const rendered = richTextToHtml(saved);
assert.match(rendered, /font-size:14pt/);
assert.match(rendered, /<strong>বাংলা \*\*literal\*\*<\/strong>/);
assert.match(rendered, /<p><br><\/p>/);
assert.match(rendered, /<ul><li><p>list item<\/p><\/li><\/ul>/);
assert.equal(saveRichTextDocument({ type: "doc", content: [{ type: "paragraph" }] }), "");
console.log("Structured description save/reopen, literal text, lists and empty paragraphs passed.");
