import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { build } from "vite";
import vue from "@vitejs/plugin-vue";

export function autoAssignExtensionName(body: any): any {
  const currentExtensionId = body.extensionId || "";
  const uuidPattern =
    /^extension_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!currentExtensionId || !uuidPattern.test(currentExtensionId)) {
    const uuid = randomUUID();
    body.extensionId = `extension_${uuid}`;
  }

  return body;
}

export function generateExtensionName(prefix: string = "extension"): string {
  const uuid = randomUUID();
  return `${prefix}_${uuid}`;
}

export function needsAutoName(body: any): boolean {
  const currentExtensionId = body.extensionId || "";
  const uuidPattern =
    /^extension_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return !currentExtensionId || !uuidPattern.test(currentExtensionId);
}

export async function buildExtensionWithVite(
  vueContent: string,
  extensionId: string
) {
  const tempDir = join(process.cwd(), ".temp-extension-build");
  const tempExtensionFile = join(tempDir, "extension.vue");
  const tempEntryFile = join(tempDir, "entry.js");

  try {
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    writeFileSync(tempExtensionFile, vueContent);

    const entryContent = `
import ExtensionComponent from './extension.vue'
export default ExtensionComponent
`;
    writeFileSync(tempEntryFile, entryContent);

    const result = await build({
      root: tempDir,
      build: {
        lib: {
          entry: tempEntryFile,
          name: extensionId,
          fileName: () => "extension.js",
          formats: ["umd"],
        },
        outDir: join(tempDir, "dist"),
        emptyOutDir: true,
        write: true,
        rollupOptions: {
          external: ["vue"],
          output: {
            globals: {
              vue: "Vue",
            },
          },
        },
      },
      plugins: [vue()],
    });

    const compiledFile = join(tempDir, "dist", "extension.js");
    const compiledCode = readFileSync(compiledFile, "utf-8");

    return compiledCode;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to build extension: ${
        error.message || "Unknown error"
      }`,
    });
  } finally {
    try {
      if (existsSync(tempDir)) {
        const fs = await import("fs/promises");
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {}
  }
}

/**
 * Heuristic check to guess if a string is a Vue SFC.
 */
export function isProbablyVueSFC(content: string): boolean {
  if (typeof content !== "string") return false;
  const trimmed = content.trim();
  if (!trimmed) return false;

  // Quick tags presence check
  const hasSfcTags = /<template[\s>]|<script[\s>]|<style[\s>]/i.test(trimmed);
  const hasClosing = /<\/template>|<\/script>|<\/style>/i.test(trimmed);

  return hasSfcTags && hasClosing;
}

/**
 * Basic SFC syntax validation - check for balanced tags and basic structure
 */
export function assertValidVueSFC(content: string): void {
  // Check balanced tags
  const templateOpen = (content.match(/<template[^>]*>/g) || []).length;
  const templateClose = (content.match(/<\/template>/g) || []).length;
  const scriptOpen = (content.match(/<script[^>]*>/g) || []).length;
  const scriptClose = (content.match(/<\/script>/g) || []).length;
  const styleOpen = (content.match(/<style[^>]*>/g) || []).length;
  const styleClose = (content.match(/<\/style>/g) || []).length;

  if (
    templateOpen !== templateClose ||
    scriptOpen !== scriptClose ||
    styleOpen !== styleClose
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid Vue SFC: unbalanced tags",
    });
  }

  // Check if has at least template or script
  if (templateOpen === 0 && scriptOpen === 0) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Invalid Vue SFC: must have at least <template> or <script>",
    });
  }

  // Check for basic Vue syntax patterns
  if (scriptOpen > 0) {
    const scriptContent = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (scriptContent && scriptContent[1]) {
      const script = scriptContent[1];
      // Check for basic JS syntax issues
      if (script.includes("export default") && !script.includes("{")) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "Invalid Vue SFC: script must have proper export default syntax",
        });
      }
    }
  }
}

/**
 * Basic JS syntax validation - check for balanced brackets and basic structure
 */
export function assertValidJsBundleSyntax(code: string): void {
  const brackets = { "(": 0, ")": 0, "{": 0, "}": 0, "[": 0, "]": 0 };

  for (const char of code) {
    if (char in brackets) {
      brackets[char as keyof typeof brackets]++;
    }
  }

  if (
    brackets["("] !== brackets[")"] ||
    brackets["{"] !== brackets["}"] ||
    brackets["["] !== brackets["]"]
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid JS syntax: unbalanced brackets",
    });
  }

  // Check for basic JS structure
  if (
    !code.includes("export") &&
    !code.includes("module.exports") &&
    !code.includes("window.")
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Invalid JS bundle: must have export statement or module.exports",
    });
  }

  // Check for obvious syntax errors
  if (code.includes("function(") && !code.includes(")")) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid JS syntax: incomplete function declaration",
    });
  }
}
