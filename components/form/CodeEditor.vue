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
import { ensureString } from "~/utils/components/form";
import { EXTENSION_GLOBALS } from "~/utils/extension/globals";

const props = defineProps<{
  modelValue?: string;
  language?: "javascript" | "vue" | "json" | "typescript";
  height?: string;
}>();

const emit = defineEmits(["update:modelValue", "diagnostics"]);

// Ensure modelValue is always a string to prevent CodeMirror errors
const code = ref(ensureString(props.modelValue));

// Watch for changes in props.modelValue and ensure it's a string
watch(
  () => props.modelValue,
  (newValue) => {
    const stringValue = ensureString(newValue);
    if (code.value !== stringValue) {
      code.value = stringValue;
    }
  },
  { immediate: true }
);

watch(code, (val) => {
  emit("update:modelValue", val);
});

const linterInstance = new eslint.Linter();

const diagnosticExtension = linter((view) => {
  if (props.language === "json") {
    emit("diagnostics", []);
    return [];
  }

  const raw = view.state.doc.toString();

  let codeToLint = raw;
  let lineOffset = 0;

  // Extract script content from Vue SFC if it's a Vue file
  if (props.language === "vue") {
    const scriptMatch = raw.match(/<script(?:\s+[^>]*)?>\s*([\s\S]*?)\s*<\/script>/);
    if (scriptMatch) {
      codeToLint = scriptMatch[1];
      // Calculate line offset where script starts
      const beforeScript = raw.substring(0, scriptMatch.index);
      lineOffset = beforeScript.split('\n').length - 1;
    }
  }

  const wrapped = `(async () => {\n${codeToLint}\n})()`;

  const lintRules = props.language === "vue" 
    ? {
        "no-undef": ["off"], // Disable undefined variable checks for Vue files
        "no-unused-vars": ["off"],
        "no-empty-function": ["off"],
      }
    : {
        "no-undef": ["error"],
        "no-unused-vars": ["off"], 
        "no-empty-function": ["off"],
      };

  const result = linterInstance.verify(
    wrapped,
    {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
      globals: EXTENSION_GLOBALS,
      rules: lintRules as any,
    }
  );

  const adjustment = 1;

  const diagnostics: Diagnostic[] = result.map((msg) => {
    // For Vue files, adjust line numbers to account for template/script structure
    let actualLine = msg.line - adjustment;
    if (props.language === "vue" && lineOffset > 0) {
      actualLine += lineOffset;
    }
    const userLine = Math.max(1, actualLine);
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

  emit("diagnostics", []);
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
    padding: "0",
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

const getLanguageExtension = () => {
  switch (props.language) {
    case "vue":
      // Use JavaScript with JSX for now until vue lang is properly set up
      return javascript({ jsx: true, typescript: true });
    case "typescript":
      return javascript({ jsx: true, typescript: true });
    case "javascript":
    default:
      return javascript({ jsx: true });
  }
};

const extensions = computed(() => [
  getLanguageExtension(),
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
]);
</script>

<template>
  <div class="rounded-md overflow-hidden ring-1 ring-slate-700">
    <NuxtCodeMirror
      v-model="code"
      :extensions="extensions"
      theme="dark"
      :height="props.height || '400px'"
      basic-setup
      :editable="true"
      :read-only="false"
    />
  </div>
</template>
