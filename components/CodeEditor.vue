<script setup lang="ts">
import { javascript } from "@codemirror/lang-javascript";
import { linter, lintGutter } from "@codemirror/lint";
import type { Diagnostic } from "@codemirror/lint";

import {
  lineNumbers,
  highlightActiveLine,
  keymap,
  EditorView,
  drawSelection,
} from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { closeBrackets } from "@codemirror/autocomplete";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import eslint from "eslint-linter-browserify";

const props = defineProps<{
  modelValue?: string;
  language?: string;
}>();

const emit = defineEmits(["update:modelValue", "diagnostics"]);

const code = ref(props.modelValue ?? "");

watch(code, (val) => {
  emit("update:modelValue", val);
});

const linterInstance = new eslint.Linter();

const diagnosticExtension = linter((view) => {
  const raw = view.state.doc.toString();

  const wrapped = `(async () => {\n${raw}\n})()`; // ✅ bọc trước khi lint

  const result = linterInstance.verify(
    wrapped,
    [
      {
        files: ["**/*.js"],
        languageOptions: {
          ecmaVersion: 2020,
          sourceType: "module",
          globals: {
            $ctx: true,
          },
        },
        rules: {
          "no-undef": "error",
          "no-unused-vars": "warn",
          "no-empty-function": "off", // ✅ cho phép function empty nếu cần
        },
      },
    ],
    { filename: "file.js" }
  );

  const adjustment = 1; // vì bạn thêm 1 dòng đầu: `(async () => {`

  const diagnostics: Diagnostic[] = result.map((msg) => {
    const userLine = Math.max(1, msg.line - adjustment); // đảm bảo >= 1
    const line = view.state.doc.line(userLine);

    const from = msg.column ? line.from + msg.column - 1 : line.from;
    const to = msg.endColumn ? line.from + msg.endColumn - 1 : line.to;

    return {
      from,
      to,
      message: msg.message,
      severity: msg.severity === 2 ? "error" : "warning",
    };
  });

  emit("diagnostics", diagnostics);
  return diagnostics;
});

const customTheme = EditorView.baseTheme({
  "&": {
    backgroundColor: "#1e1e1e",
    color: "#d4d4d4",
    fontSize: "14px",
    fontFamily: "'Fira Code', monospace",
    borderRadius: "8px",
    border: "1px solid #3c3c3c",
    overflow: "hidden",
  },

  ".cm-content": {
    padding: "12px",
    lineHeight: "1.6",
  },

  ".cm-content *::selection": {
    backgroundColor: "#264F78",
    color: "#ffffff",
  },

  ".cm-line": {
    padding: "0 8px",
  },

  ".cm-gutters": {
    backgroundColor: "#252526",
    color: "#858585",
    borderRight: "1px solid #3c3c3c",
  },

  ".cm-activeLine": {
    backgroundColor: "#2a2d2e",
  },

  ".cm-selectionBackground": {
    backgroundColor: "#264F78",
  },
  ".cm-selectionMatch": {
    backgroundColor: "#515c6a80",
  },

  ".cm-cursor": {
    borderLeft: "2px solid white",
  },

  // 🎨 Syntax highlight
  ".ͼp": {
    color: "#C586C0!important", // keyword: return, const, let, if, else
    fontWeight: "normal",
  },
  ".ͼm": {
    color: "#B5CEA8", // number literal
  },
  ".ͼk": {
    color: "#CE9178", // string literal
  },
  ".ͼb": {
    color: "#D4D4D4", // punctuation: {} [] ()
  },
  ".ͼl": {
    color: "#9CDCFE", // property name
  },
  ".ͼd": {
    color: "#9CDCFE", // variable name (changed from #DCDCaa for VSCode accuracy)
  },
  ".ͼg": {
    color: "#DCDCAA", // function name
  },
  ".ͼe": {
    color: "#C586C0", // class, enum, type, etc.
  },
  ".ͼa": {
    color: "#4FC1FF", // attribute name (in JSX/HTML)
  },
  ".ͼc": {
    color: "#6A9955", // comment
  },
  ".ͼn": {
    color: "#D16969", // error (red underline, usually)
  },
});

const extensions = [
  javascript({ jsx: true, typescript: true }),
  closeBrackets(),
  bracketMatching(),
  highlightActiveLine(),
  indentOnInput(),
  lintGutter(),
  lineNumbers(),
  keymap.of([indentWithTab]),
  drawSelection(),
  diagnosticExtension,
  customTheme,
];
</script>

<template>
  <div class="rounded-md overflow-hidden ring-1 ring-slate-700">
    <NuxtCodeMirror
      v-model="code"
      :extensions="extensions"
      theme="dark"
      height="400px"
      basic-setup
      :editable="true"
      :read-only="false"
    />
  </div>
</template>
