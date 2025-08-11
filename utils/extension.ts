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
