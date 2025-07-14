<script setup lang="ts">
import { closeBrackets } from "@codemirror/autocomplete";
import { javascript } from "@codemirror/lang-javascript";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { lintGutter } from "@codemirror/lint";
import {
  highlightActiveLine,
  lineNumbers,
  keymap,
  EditorView,
  drawSelection,
} from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";

const props = defineProps<{
  modelValue: string | undefined;
  language?: string;
}>();

const emit = defineEmits(["update:modelValue"]);
const code = ref(props.modelValue ?? "");
watch(
  () => code.value,
  (newVal) => {
    emit("update:modelValue", newVal);
  }
);

const customVscodeTheme = EditorView.baseTheme({
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
  ctxAutocomplete,
  customVscodeTheme,
  drawSelection(),
];
</script>

<template>
  <div class="rounded-md overflow-hidden ring-1 ring-slate-700">
    <NuxtCodeMirror
      :class="'cm-custom'"
      v-model="code"
      :extensions="extensions"
      theme="dark"
      height="400px"
      basicSetup
      :editable="true"
      :readOnly="false"
    />
  </div>
</template>
