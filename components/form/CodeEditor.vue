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
import { closeBrackets, autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { 
  bracketMatching, 
  indentUnit,
  foldGutter,
  foldKeymap,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import eslint from "eslint-linter-browserify";
import { ensureString } from "~/utils/components/form";
import { EXTENSION_GLOBALS } from "~/utils/extension/globals";

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

const linterInstance = new eslint.Linter();

const diagnosticExtension = linter((view) => {
  // Skip linting for JSON and HTML
  if (props.language === "json" || props.language === "html") {
    emit("diagnostics", []);
    return [];
  }

  const raw = view.state.doc.toString();

  let codeToLint = raw;
  let lineOffset = 0;

  // Extract script content from Vue SFC if it's a Vue file
  if (props.language === "vue") {
    // For Vue files, only lint the script section
    const scriptMatch = raw.match(/<script(?:\s+[^>]*)?>\s*([\s\S]*?)\s*<\/script>/);
    if (scriptMatch && scriptMatch[1] && scriptMatch.index !== undefined) {
      codeToLint = scriptMatch[1];
      // Calculate line offset where script starts
      const beforeScript = raw.substring(0, scriptMatch.index + scriptMatch[0].indexOf('>') + 1);
      lineOffset = beforeScript.split('\n').length;
    } else {
      // No script section found, skip linting
      emit("diagnostics", []);
      return [];
    }
  }

  // Wrap in async function to allow top-level await
  const wrapped = `(async () => {\n${codeToLint}\n})()`;
  
  // Also check unwrapped code for certain rules that need direct scope
  const unwrapped = codeToLint;

  // Comprehensive ESLint rules configuration for Vue and JavaScript
  const baseRules = {
    // ============ CRITICAL ERRORS - Always catch these ============
    // Variable/Assignment Errors
    "no-const-assign": ["error"],          // const a = 1; a = 2; ❌
    "no-func-assign": ["error"],           // function a(){}; a = 1; ❌
    "no-class-assign": ["error"],          // class A{}; A = 1; ❌
    
    // Syntax/Structure Errors
    "no-dupe-keys": ["error"],             // {a: 1, a: 2} ❌
    "no-dupe-args": ["error"],             // function(a, a) {} ❌
    "no-duplicate-case": ["error"],        // switch with duplicate cases ❌
    "no-unreachable": ["error"],           // code after return ❌
    "no-unsafe-finally": ["error"],        // return in finally ❌
    "no-invalid-regexp": ["error"],        // new RegExp('[') ❌
    
    // Logic Errors
    "no-cond-assign": ["error"],           // if (a = 1) ❌
    "no-constant-condition": ["warn"],     // if (true) ⚠️
    "no-self-assign": ["error"],           // a = a ❌
    "no-self-compare": ["warn"],           // a === a ⚠️
    "use-isnan": ["error"],                // Must use isNaN() ❌
    "valid-typeof": ["error"],              // typeof a === "strnig" ❌
    
    // Async/Promise Errors
    "no-async-promise-executor": ["error"], // new Promise(async () => {}) ❌
    "no-await-in-loop": ["warn"],          // for() { await ... } ⚠️
    "require-atomic-updates": ["error"],    // Race conditions ❌
    
    // ============ CODE QUALITY - Warn but don't block ============
    "no-unused-vars": ["warn"],            // Unused variables ⚠️
    "no-empty": ["warn"],                   // Empty blocks ⚠️
    "no-empty-function": ["off"],           // Empty functions OK ✅
    "no-debugger": ["warn"],                // debugger statements ⚠️
    "no-console": ["off"],                  // console.log OK ✅
    
    // ============ STYLE/PREFERENCE - Disabled ============
    "no-unexpected-multiline": ["off"],     // Line breaks OK ✅
    "no-mixed-spaces-and-tabs": ["off"],    // Mixed indentation OK ✅
    "semi": ["off"],                        // Semicolons optional ✅
    "quotes": ["off"],                      // Quote style optional ✅
    "indent": ["off"],                      // Indentation optional ✅
  };

  const vueSpecificRules = {
    ...baseRules,
    // ============ VUE-SPECIFIC OVERRIDES ============
    "no-undef": ["off"],                   // Vue auto-imports (ref, computed, etc) ✅
    "no-unused-expressions": ["off"],       // Template expressions {{ }} ✅
    "no-redeclare": ["off"],                // Props can shadow ✅
    "no-shadow": ["off"],                   // Props/data shadowing ✅
    "no-use-before-define": ["off"],        // Setup can use later declarations ✅
    
    // Relaxed for Vue composition
    "prefer-const": ["warn"],               // let is OK in setup ⚠️
    "no-unused-vars": ["off"],              // Props/emits may appear unused ✅
    "no-empty-pattern": ["off"],            // const {} = props OK ✅
  };

  const javascriptRules = {
    ...baseRules,
    // ============ JAVASCRIPT STRICT MODE ============
    "no-undef": ["error"],                 // Undefined variables ❌
    "no-redeclare": ["error"],              // Redeclaration ❌
    "no-shadow": ["warn"],                  // Variable shadowing ⚠️
    "no-use-before-define": ["error"],      // Use before define ❌
    "prefer-const": ["warn"],               // Prefer const ⚠️
  };

  const lintRules = props.language === "vue" 
    ? vueSpecificRules
    : javascriptRules;

  // Run ESLint on wrapped code (for top-level await support)
  const wrappedResult = linterInstance.verify(
    wrapped,
    {
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
    }
  );

  // Run ESLint on unwrapped code for scope-sensitive rules
  const scopeRules = {
    "no-const-assign": ["error"],
    "no-func-assign": ["error"], 
    "no-class-assign": ["error"],
    "no-redeclare": props.language === "vue" ? ["off"] : ["error"],
    "no-undef": props.language === "vue" ? ["off"] : ["error"],
  };

  const unwrappedResult = linterInstance.verify(
    unwrapped,
    {
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
    }
  );

  // Adjust line numbers for wrapped results (subtract 1 for wrapper function)
  const adjustedWrappedResult = wrappedResult.map(msg => ({
    ...msg,
    line: Math.max(1, msg.line - 1)
  }));

  // Combine and deduplicate results
  const seenErrors = new Set();
  const result = [...unwrappedResult, ...adjustedWrappedResult].filter(msg => {
    const key = `${msg.line}:${msg.column}:${msg.ruleId}`;
    if (seenErrors.has(key)) return false;
    seenErrors.add(key);
    return true;
  });

  // Optional debug logging (commented out for production)
  // console.log('ESLint results:', result);
  // console.log('Manual checks:', manualChecks);

  // Manual check for const reassignment if ESLint doesn't catch it
  const manualChecks: any[] = [];
  if (props.language === "vue" || props.language === "javascript") {
    // More comprehensive const reassignment check
    const lines = codeToLint.split('\n');
    const constDeclarations = new Map();
    
    // First pass: collect const declarations
    lines.forEach((line, index) => {
      const constMatch = line.match(/const\s+(\w+)\s*=/);
      if (constMatch) {
        constDeclarations.set(constMatch[1], index + 1);
      }
    });
    
    // Second pass: check for reassignments
    lines.forEach((line, index) => {
      const assignMatch = line.match(/(\w+)\s*=/);
      if (assignMatch && !line.includes('const ') && !line.includes('let ') && !line.includes('var ')) {
        const varName = assignMatch[1];
        if (constDeclarations.has(varName)) {
          manualChecks.push({
            line: index + 2, // +1 for 1-based, +1 for wrapper adjustment
            column: line.indexOf(assignMatch[0]),
            endColumn: line.indexOf(assignMatch[0]) + assignMatch[0].length,
            message: `Assignment to constant variable '${varName}'`,
            severity: 2,
            ruleId: "no-const-assign"
          });
        }
      }
    });
  }

  const combinedResult = [...result, ...manualChecks];

  const adjustment = 1;

  const diagnostics: Diagnostic[] = combinedResult
    .filter((msg) => {
      // Filter out specific parsing errors for Vue templates
      if (props.language === "vue") {
        const vueParsingIgnores = [
          "Parsing error: Unexpected token :",     // TypeScript types
          "Parsing error: Unexpected token {",     // Template syntax
          "Parsing error: Unexpected token }",     // Template syntax  
          "Parsing error: Unexpected token ,",     // Object trailing commas
          "Parsing error: Unexpected token )",     // Function calls
          "Parsing error: Unexpected token ;",     // Statement endings
          "Parsing error: Unexpected token <",     // Template tags
          "Parsing error: Unexpected token >",     // Template tags
          "Parsing error: Unexpected token =",     // Vue directives
          "Parsing error: Unexpected token @",     // Event handlers
          "Parsing error: Unexpected token #",     // Slot syntax
          "Parsing error: Unexpected token v-",    // Vue directives
        ];
        
        // Filter out Vue-specific parsing errors but keep semantic errors
        if (msg.message.startsWith("Parsing error:")) {
          return !vueParsingIgnores.some(ignored => 
            msg.message.includes(ignored.replace("Parsing error: ", ""))
          );
        }
      }
      
      // Keep all semantic errors and warnings
      return true;
    })
    .map((msg) => {
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
      // Use proper Vue language support for Vue SFC files
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

// Auto-indent completely disabled - users will use Tab for manual indenting

const extensions = computed(() => [
  // Language support
  getLanguageExtension(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  
  // Basic editor features (manual basic-setup without auto-indent)
  lineNumbers(),
  foldGutter(),
  dropCursor(),
  drawSelection(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  
  // Editing features
  closeBrackets(),
  autocompletion(),
  bracketMatching(),
  indentUnit.of("  "), // 2 spaces
  
  // History
  history(),
  
  // Linting
  lintGutter(),
  diagnosticExtension,
  
  // Custom keymaps (NO auto-indent)
  keymap.of([
    ...completionKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...searchKeymap,
    indentWithTab,
    { key: "Enter", run: insertNewline }, // Force plain newline
    // Explicitly override default Enter behavior
    { key: "Enter", run: insertNewline, preventDefault: true },
  ]),
  
  // Theme
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
