import { javascript } from "@codemirror/lang-javascript";
import { vue } from "@codemirror/lang-vue";
import { html } from "@codemirror/lang-html";
import { linter, lintGutter } from "@codemirror/lint";
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
} from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";

export function useCodeMirrorExtensions() {
  // Language extension - Only JavaScript, no TypeScript
  function getLanguageExtension(language?: "javascript" | "vue" | "json" | "html") {
    switch (language) {
      case "vue":
        return vue();
      case "html":
        return html();
      case "javascript":
      default:
        return javascript({ jsx: true, typescript: false });
    }
  }

  // Disable linting completely for pure JavaScript mode
  const diagnosticExtension = linter((view) => {
    return [];
  });

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

  return {
    getLanguageExtension,
    diagnosticExtension,
    basicSetup
  };
}