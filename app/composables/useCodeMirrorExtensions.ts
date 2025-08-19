import { javascript } from "@codemirror/lang-javascript";
import { vue } from "@codemirror/lang-vue";
import { html } from "@codemirror/lang-html";
import { linter, lintGutter } from "@codemirror/lint";
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import { EditorState } from "@codemirror/state";
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
  indentOnInput,
} from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";

export function useCodeMirrorExtensions() {
  // No custom config needed for Vue anymore

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

  // Create linter based on language  
  const createLinter = (language?: "javascript" | "vue" | "json" | "html", onDiagnostics?: (diags: any[]) => void) => {
    return linter((view) => {
      const diagnostics: any[] = [];
      const text = view.state.doc.toString();
      
      // Skip linting for json and html
      if (language === 'json' || language === 'html') {
        return diagnostics;
      }
      
      let codeToLint = text;
      let offset = 0;
      
      // For Vue files, extract script content
      if (language === 'vue') {
        const scriptMatch = text.match(/<script[^>]*>([\s\S]*?)<\/script>/);
        if (!scriptMatch) return diagnostics;
        
        codeToLint = scriptMatch[1];
        // Calculate offset to the start of script content
        offset = text.indexOf(scriptMatch[1]);
      }
      
      try {
        // Parse với acorn
        const ast = acorn.parse(codeToLint, {
          ecmaVersion: 2020,
          sourceType: "module",
          locations: true,
          onComment: false,
        });
        
        // Track const variables
        const constVars = new Set<string>();
        
        // Walk through AST
        walk.simple(ast, {
          VariableDeclaration(node: any) {
            if (node.kind === 'const') {
              for (const decl of node.declarations) {
                if (decl.id.type === 'Identifier') {
                  constVars.add(decl.id.name);
                }
              }
            }
          },
          AssignmentExpression(node: any) {
            if (node.left.type === 'Identifier' && constVars.has(node.left.name)) {
              diagnostics.push({
                from: node.left.start + offset,
                to: node.left.end + offset,
                severity: 'error',
                message: `Cannot assign to const variable '${node.left.name}'`,
              });
            }
          },
          UpdateExpression(node: any) {
            if (node.argument.type === 'Identifier' && constVars.has(node.argument.name)) {
              diagnostics.push({
                from: node.start + offset,
                to: node.end + offset,
                severity: 'error',
                message: `Cannot update const variable '${node.argument.name}'`,
              });
            }
          }
        });
        
      } catch (error: any) {
        // Parse errors
        if (error.loc) {
          const errorPos = offset + (error.pos || 0);
          diagnostics.push({
            from: errorPos,
            to: errorPos + 1,
            severity: 'error',
            message: error.message.replace(/\s*\(\d+:\d+\)$/, ''),
          });
        }
      }
      
      // Emit diagnostics if callback provided
      if (onDiagnostics) {
        onDiagnostics(diagnostics);
      }
      
      return diagnostics;
    });
  };

  // Basic setup function that takes language parameter
  const getBasicSetup = (language?: "javascript" | "vue" | "json" | "html", onDiagnostics?: (diags: any[]) => void) => {
    const setup = [
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
      createLinter(language, onDiagnostics),
      lintGutter(),
      keymap.of([
        indentWithTab,
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...searchKeymap,
      ]),
    ];
    
    // Never add auto-indent for Vue - it causes issues
    if (language === 'javascript' || language === 'html' || language === 'json') {
      setup.push(indentOnInput());
    }
    
    return setup;
  };

  return {
    getLanguageExtension,
    createLinter,
    getBasicSetup,
    basicSetup: getBasicSetup(), // Default for backward compatibility
  };
}