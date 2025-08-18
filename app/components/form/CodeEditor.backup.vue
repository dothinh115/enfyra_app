<script setup lang="ts">
import { javascript } from "@codemirror/lang-javascript";
import { vue } from "@codemirror/lang-vue";
import { html } from "@codemirror/lang-html";
import { linter, lintGutter } from "@codemirror/lint";
import type { Diagnostic } from "@codemirror/lint";

import {
  lineNumbers,
  highlightActiveLine,
  keymap,
  EditorView,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
} from "@codemirror/view";
import {
  indentWithTab,
  insertNewline,
  history,
  defaultKeymap,
  historyKeymap,
} from "@codemirror/commands";
import {
  closeBrackets,
  autocompletion,
  completionKeymap,
} from "@codemirror/autocomplete";
import {
  bracketMatching,
  indentUnit,
  foldGutter,
  foldKeymap,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { createAcornLinter } from "../../utils/editor/acornLinter";
import { EXTENSION_GLOBALS } from "../../utils/extension/globals";
import { ensureString } from "../../utils/components/form";

const props = defineProps<{
  modelValue?: string;
  language?: "javascript" | "vue" | "json" | "typescript" | "html";
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

const acornLinter = createAcornLinter(EXTENSION_GLOBALS);

const diagnosticExtension = linter((view) => {
  if (props.language === "json" || props.language === "html") {
    emit("diagnostics", []);
    return [];
  }

  const raw = view.state.doc.toString();

  let codeToLint = raw;
  let lineOffset = 0;

  if (props.language === "vue") {
    const scriptMatch = raw.match(
      /<script(?:\s+[^>]*)?>\s*([\s\S]*?)\s*<\/script>/
    );
    if (scriptMatch && scriptMatch[1] && scriptMatch.index !== undefined) {
      codeToLint = scriptMatch[1];
      const beforeScript = raw.substring(
        0,
        scriptMatch.index + scriptMatch[0].indexOf(">") + 1
      );
      lineOffset = beforeScript.split("\n").length;
    } else {
      emit("diagnostics", []);
      return [];
    }
  }

  const wrapped =
    props.language === "javascript"
      ? `(async () => {\n${codeToLint}\n})()`
      : codeToLint;

  const unwrapped = codeToLint;

  const baseRules = {
    "no-const-assign": ["error"],
    "no-func-assign": ["error"],
    "no-class-assign": ["error"],
    "no-dupe-keys": ["error"],
    "no-dupe-args": ["error"],
    "no-duplicate-case": ["error"],
    "no-unreachable": ["error"],
    "no-unsafe-finally": ["error"],
    "no-invalid-regexp": ["error"],
    "no-cond-assign": ["error"],
    "no-constant-condition": ["warn"],
    "no-self-assign": ["error"],
    "no-self-compare": ["warn"],
    "use-isnan": ["error"],
    "valid-typeof": ["error"],
    "no-async-promise-executor": ["error"],
    "no-await-in-loop": ["warn"],
    "require-atomic-updates": ["error"],
    "no-unused-vars": ["warn"],
    "no-empty": ["warn"],
    "no-empty-function": ["off"],
    "no-debugger": ["warn"],
    "no-console": ["off"],
    "no-unexpected-multiline": ["off"],
    "no-mixed-spaces-and-tabs": ["off"],
    semi: ["off"],
    quotes: ["off"],
    indent: ["off"],
  };

  const vueSpecificRules = {
    ...baseRules,
    "no-undef": ["off"],
    "no-unused-expressions": ["off"],
    "no-redeclare": ["off"],
    "no-shadow": ["off"],
    "no-use-before-define": ["off"],
    "prefer-const": ["warn"],
    "no-unused-vars": ["off"],
    "no-empty-pattern": ["off"],
  };

  const javascriptRules = {
    ...baseRules,
    "no-undef": ["error"],
    "no-redeclare": ["error"],
    "no-shadow": ["warn"],
    "no-use-before-define": ["error"],
    "prefer-const": ["warn"],
  };

  const lintRules =
    props.language === "vue" ? vueSpecificRules : javascriptRules;

  const wrappedResult = linterInstance.verify(wrapped, {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: EXTENSION_GLOBALS,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          modules: true,
        },
      },
    },
    rules: lintRules as any,
  });

  const scopeRules = {
    "no-const-assign": ["error"],
    "no-func-assign": ["error"],
    "no-class-assign": ["error"],
    "no-redeclare": props.language === "vue" ? ["off"] : ["error"],
    "no-undef": props.language === "vue" ? ["off"] : ["error"],
  };

  const unwrappedResult = linterInstance.verify(unwrapped, {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: EXTENSION_GLOBALS,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          modules: true,
        },
      },
    },
    rules: scopeRules as any,
  });

  const adjustedWrappedResult = wrappedResult.map((msg) => ({
    ...msg,
    line:
      props.language === "javascript" ? Math.max(1, msg.line - 1) : msg.line,
  }));

  const seenErrors = new Set();
  const result = [...unwrappedResult, ...adjustedWrappedResult].filter(
    (msg) => {
      const key = `${msg.line}:${msg.column}:${msg.ruleId}`;
      if (seenErrors.has(key)) return false;
      seenErrors.add(key);
      return true;
    }
  );

  const combinedResult = [...result];

  const adjustment = 1;

  const diagnostics: Diagnostic[] = combinedResult
    .filter((msg) => {
      if (props.language === "vue") {
        const vueParsingIgnores = [
          "Parsing error: Unexpected token :",
          "Parsing error: Unexpected token {",
          "Parsing error: Unexpected token }",
          "Parsing error: Unexpected token ,",
          "Parsing error: Unexpected token )",
          "Parsing error: Unexpected token ;",
          "Parsing error: Unexpected token <",
          "Parsing error: Unexpected token >",
          "Parsing error: Unexpected token =",
          "Parsing error: Unexpected token @",
          "Parsing error: Unexpected token #",
          "Parsing error: Unexpected token v-",
        ];

        if (msg.message.startsWith("Parsing error:")) {
          return !vueParsingIgnores.some((ignored) =>
            msg.message.includes(ignored.replace("Parsing error: ", ""))
          );
        }
      }

      return true;
    })
    .map((msg) => {
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
    color: "#D4D4D4",
  },
  ".ͼl": {
    color: "#9CDCFE",
  },
  ".ͼd": {
    color: "#9CDCFE",
  },
  ".ͼg": {
    color: "#DCDCAA",
  },
  ".ͼe": {
    color: "#C586C0",
  },
  ".ͼa": {
    color: "#4FC1FF",
  },
  ".ͼc": {
    color: "#6A9955",
  },
  ".ͼn": {
    color: "#D16969",
  },
});

const getLanguageExtension = () => {
  switch (props.language) {
    case "vue":
      return vue();
    case "html":
      return html();
    case "typescript":
      return javascript({ jsx: true, typescript: true });
    case "javascript":
    default:
      return javascript({ jsx: true });
  }
};

const extensions = computed(() => [
  getLanguageExtension(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  lineNumbers(),
  foldGutter(),
  dropCursor(),
  drawSelection(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  closeBrackets(),
  autocompletion(),
  bracketMatching(),
  indentUnit.of("  "),
  history(),
  lintGutter(),
  diagnosticExtension,
  keymap.of([
    ...completionKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...searchKeymap,
    indentWithTab,
    { key: "Enter", run: insertNewline },
    { key: "Enter", run: insertNewline, preventDefault: true },
  ]),
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
      :editable="true"
      :read-only="false"
    />
  </div>
</template>
