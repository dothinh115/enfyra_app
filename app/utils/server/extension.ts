import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { build } from "vite";
import vue from "@vitejs/plugin-vue";

const EXTENSION_UUID_PATTERN = /^extension_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function autoAssignExtensionName(body: any): any {
  const currentExtensionId = body.extensionId || "";

  if (!currentExtensionId || !EXTENSION_UUID_PATTERN.test(currentExtensionId)) {
    const uuid = randomUUID();
    body.extensionId = `extension_${uuid}`;
  }

  return body;
}


export async function buildExtensionWithVite(
  vueContent: string,
  extensionId: string
) {
  // Generate unique temp directory name for each build to avoid conflicts
  const buildId = `${extensionId}-${Date.now()}-${randomUUID()}`;
  const tempDir = join(process.cwd(), ".temp-extension-builds", buildId);
  const tempExtensionFile = join(tempDir, "extension.vue");
  const tempEntryFile = join(tempDir, "entry.js");

  try {
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    writeFileSync(tempExtensionFile, vueContent);
    writeFileSync(tempEntryFile, `
import ExtensionComponent from './extension.vue'
export default ExtensionComponent
`);

    await build({
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

export function isProbablyVueSFC(content: string): boolean {
  if (typeof content !== "string") return false;
  const trimmed = content.trim();
  if (!trimmed) return false;

  const hasSfcTags = /<template[\s>]|<script[\s>]|<style[\s>]/i.test(trimmed);
  const hasClosing = /<\/template>|<\/script>|<\/style>/i.test(trimmed);

  return hasSfcTags && hasClosing;
}

export function assertValidVueSFC(content: string): void {
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

  if (templateOpen === 0 && scriptOpen === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid Vue SFC: must have at least <template> or <script>",
    });
  }

  if (scriptOpen > 0) {
    const scriptContent = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (scriptContent && scriptContent[1]) {
      const script = scriptContent[1];
      if (script.includes("export default") && !script.includes("{")) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid Vue SFC: script must have proper export default syntax",
        });
      }
    }
  }
}

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

  if (
    !code.includes("export") &&
    !code.includes("module.exports") &&
    !code.includes("window.")
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid JS bundle: must have export statement or module.exports",
    });
  }

  if (code.includes("function(") && !code.includes(")")) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid JS syntax: incomplete function declaration",
    });
  }
}