import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { build } from "vite";
import vue from "@vitejs/plugin-vue";

async function buildExtensionWithVite(extensionId: string, vueContent: string) {
  console.log("Building extension with ID:", extensionId);
  console.log("Vue content preview:", vueContent.substring(0, 200) + "...");

  const tempDir = join(process.cwd(), ".temp-extension-build");
  const tempExtensionFile = join(tempDir, "extension.vue");
  const tempEntryFile = join(tempDir, "entry.js");

  try {
    // Create temp directory
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Write Vue content to temp file
    writeFileSync(tempExtensionFile, vueContent);

    // Create entry file for UMD build
    const entryContent = `
import ExtensionComponent from './extension.vue'
export default ExtensionComponent
`;
    writeFileSync(tempEntryFile, entryContent);

    // Build with Vite to get compiled JavaScript
    const result = await build({
      root: tempDir,
      build: {
        lib: {
          entry: tempEntryFile,
          name: "Extension", // Always use "Extension" for consistency
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

    console.log("Vite build name:", "Extension");

    // Read the compiled JavaScript
    const compiledFile = join(tempDir, "dist", "extension.js");
    const compiledCode = readFileSync(compiledFile, "utf-8");

    console.log(
      "Compiled code preview:",
      compiledCode.substring(0, 300) + "..."
    );
    console.log("Compiled code length:", compiledCode.length);

    return compiledCode;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to build extension: ${
        error.message || "Unknown error"
      }`,
    });
  } finally {
    // Clean up temp files
    try {
      if (existsSync(tempDir)) {
        const fs = await import("fs/promises");
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

export default defineEventHandler(async (event) => {
  const method = event.method;

  try {
    let body = null;
    let compiledCode = null;

    // Only read body for POST/PATCH requests
    if (method === "POST" || method === "PATCH") {
      body = await readBody(event);

      // Check if body contains 'code' field that needs compilation
      if (body && body.code && typeof body.code === "string") {
        // Get extension ID from path or body
        const pathParts = event.path.split("/");
        const extensionId =
          pathParts[pathParts.length - 1] ||
          body.id ||
          body.name ||
          "extension_" + Date.now();

        // For page extensions, use a default name to ensure consistency
        // All page extensions will have the same component name for easy finding
        let componentName = "Extension";
        if (body.type === "page") {
          componentName = "Extension";
        } else {
          // For other types, use extension ID (future support)
          componentName = `Extension_${body.id || extensionId}`;
        }

        console.log("Path parts:", pathParts);
        console.log("Extension type:", body.type);
        console.log("Component name for compilation:", componentName);
        console.log("Body ID:", body.id);
        console.log("Body name:", body.name);

        try {
          // Compile Vue SFC to JavaScript with Vite
          compiledCode = await buildExtensionWithVite(componentName, body.code);

          // Replace the code field with compiled JavaScript
          body.code = compiledCode;
        } catch (compileError: any) {
          // If compilation fails, silently skip and keep the original code
          // This handles cases where code was already compiled before
          console.warn(
            `Extension compilation failed for ${extensionId}, keeping original code:`,
            compileError.message
          );

          // Remove the code field from body to keep original code unchanged
          delete body.code;
        }
      }
    }

    // Make API call to backend
    const config = useRuntimeConfig();
    const apiPath = event.path.replace("/api", "");
    const targetUrl = `${config.public.apiUrl}${apiPath}`;

    const response = await $fetch(targetUrl, {
      method: "PATCH",
      headers: {
        cookie: getHeader(event, "cookie") || "",
        authorization: event.context.proxyHeaders?.authorization || "",
        "Content-Type": "application/json",
      },
      body: body || undefined,
    });

    return response;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage:
        error.message || `Failed to process extension definition ${method}`,
    });
  }
});
