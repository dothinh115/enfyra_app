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
  }
);

watch(code, (val) => {
  emit("update:modelValue", val);
});

// Create Acorn linter instead of ESLint
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

  try {
    const diagnostics = acornLinter(codeToLint, props.language || "javascript").map(diagnostic => {
      // Adjust line numbers for Vue files
      if (props.language === "vue" && lineOffset > 0) {
        return {
          ...diagnostic,
          from: diagnostic.from + lineOffset,
          to: diagnostic.to + lineOffset,
        };
      }
      return diagnostic;
    });
    
    emit("diagnostics", diagnostics);
    return diagnostics;
  } catch (error) {
    console.warn("Linting error:", error);
    emit("diagnostics", []);
    return [];
  }
});

// Language extension
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

const languageExtension = computed(() => getLanguageExtension());

// Basic setup with minimal features for better performance
const basicSetup = [
  lineNumbers(),
  highlightActiveLine(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  rectangularSelection(),
  crosshairCursor(),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  highlightSelectionMatches(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  indentUnit.of("  "),
  keymap.of([
    indentWithTab,
    ...defaultKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...searchKeymap,
  ]),
];

// VS Code-style dark theme
const customTheme = computed(() => EditorView.baseTheme({
  "&": {
    backgroundColor: "#1e1e1e",
    color: "#d4d4d4",
    fontSize: "14px",
    fontFamily: "'Fira Code', monospace",
    borderRadius: "8px",
    border: "1px solid #3c3c3c",
    overflow: "hidden",
    height: props.height || "400px",
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
}));

// Editor extensions
const extensions = computed(() => [
  ...basicSetup,
  languageExtension.value,
  diagnosticExtension,
  lintGutter(),
  customTheme.value,
  EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      code.value = update.state.doc.toString();
    }
  }),
]);

// CodeMirror ref
const editorRef = ref<HTMLDivElement>();
const editorView = ref<EditorView>();

onMounted(() => {
  if (editorRef.value) {
    editorView.value = new EditorView({
      doc: code.value,
      extensions: extensions.value,
      parent: editorRef.value,
    });
  }
});

onUnmounted(() => {
  editorView.value?.destroy();
});

// Watch for extension changes
watch(
  extensions,
  (newExtensions) => {
    if (editorView.value) {
      editorView.value.dispatch({
        effects: EditorView.reconfigure.of(newExtensions),
      });
    }
  },
  { deep: true }
);

// Watch for external code changes
watch(code, (newCode) => {
  if (editorView.value) {
    const currentCode = editorView.value.state.doc.toString();
    if (currentCode !== newCode) {
      editorView.value.dispatch({
        changes: {
          from: 0,
          to: currentCode.length,
          insert: newCode,
        },
      });
    }
  }
});
</script>

<template>
  <div class="rounded-md overflow-hidden ring-1 ring-slate-700">
    <div ref="editorRef" class="codemirror-editor" />
  </div>
</template>

<style scoped>
.codemirror-editor {
  font-family: "Fira Code", "JetBrains Mono", monospace;
}
</style>