import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import JSZip from "jszip";
import { build } from "vite";
import vue from "@vitejs/plugin-vue";
import { checkPluginPermission } from "../../../utils/auth/check-permissions";

interface PluginRegistry {
  id: string;
  type: "component" | "page";
  url?: string; // Optional - will be auto-generated
  active: boolean;
  description?: string;
  registration?: {
    miniSidebar?: {
      id: string;
      label: string;
      icon: string;
      route: string;
    };
    menuItem?: {
      label: string;
      icon: string;
      route: string;
      sidebarId: string;
    };
    // Legacy format support
    routePattern?: string;
    title?: string;
    icon?: string;
  };
}

async function processPlugin(registry: PluginRegistry, zipContent: JSZip) {
  const publicDir = join(process.cwd(), "public");
  const pluginsDir = join(publicDir, "plugins");
  const pluginDir = join(pluginsDir, registry.id);
  const registryPath = join(publicDir, "plugins", "plugin-registry.json");

  // Check if plugin already exists
  const isUpdate = existsSync(pluginDir);

  if (isUpdate) {
    // Remove old plugin files
    const fs = await import("fs/promises");
    await fs.rm(pluginDir, { recursive: true, force: true });
  }

  // Create plugin directory
  mkdirSync(pluginDir, { recursive: true });

  // Get plugin.vue content
  const pluginVueFile = zipContent.file("plugin.vue");
  if (!pluginVueFile) {
    throw createError({
      statusCode: 500,
      statusMessage: "Plugin.vue file not found in zip",
    });
  }

  const pluginVueContent = await pluginVueFile.async("text");

  // Build plugin with Vite
  await buildPluginWithVite(registry.id, pluginVueContent, pluginDir);

  // Update plugin registry
  await updatePluginRegistry(registry, registryPath, isUpdate);
}

async function buildPluginWithVite(
  pluginId: string,
  vueContent: string,
  outputDir: string
) {
  const tempDir = join(process.cwd(), ".temp-plugin-build");
  const tempPluginFile = join(tempDir, "plugin.vue");
  const tempEntryFile = join(tempDir, "entry.js");

  try {
    // Create temp directory
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Write Vue content to temp file
    writeFileSync(tempPluginFile, vueContent);

    // Create entry file for UMD build
    const entryContent = `
import PluginComponent from './plugin.vue'
export default PluginComponent
`;
    writeFileSync(tempEntryFile, entryContent);

    // Build with Vite
    await build({
      root: tempDir,
      build: {
        lib: {
          entry: tempEntryFile,
          name: `Plugin_${pluginId.replace(/[^a-zA-Z0-9]/g, "_")}`,
          fileName: () => "plugin.js",
          formats: ["umd"],
        },
        outDir: outputDir,
        emptyOutDir: false,
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
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to build plugin: ${
        error.message || "Unknown error"
      }`,
    });
  } finally {
    // Clean up temp files
    try {
      if (existsSync(tempPluginFile)) {
        const fs = await import("fs/promises");
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

async function updatePluginRegistry(
  newPlugin: PluginRegistry,
  registryPath: string,
  isUpdate: boolean = false
) {
  let registryData: { plugins: PluginRegistry[] } = { plugins: [] };

  // Read existing registry
  if (existsSync(registryPath)) {
    try {
      const registryContent = readFileSync(registryPath, "utf-8");
      const parsed = JSON.parse(registryContent);

      // Handle both old format (array) and new format (object with plugins array)
      if (Array.isArray(parsed)) {
        registryData = { plugins: parsed };
      } else if (parsed.plugins && Array.isArray(parsed.plugins)) {
        registryData = parsed;
      } else {
        registryData = { plugins: [] };
      }
    } catch (error) {
      registryData = { plugins: [] };
    }
  }

  // Check if plugin already exists
  const existingIndex = registryData.plugins.findIndex(
    (p) => p.id === newPlugin.id
  );

  // Auto-generate URL if not provided
  if (!newPlugin.url) {
    newPlugin.url = `/api/plugin/${newPlugin.id}/plugin.js`;
  }

  if (existingIndex !== -1) {
    // Update existing plugin
    registryData.plugins[existingIndex] = newPlugin;
  } else {
    // Add new plugin
    registryData.plugins.push(newPlugin);
  }

  // Write updated registry
  writeFileSync(registryPath, JSON.stringify(registryData, null, 2));
}

export default defineEventHandler(async (event) => {
  // Kiểm tra quyền POST cho plugin registry
  await checkPluginPermission(event, "POST");

  try {
    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file uploaded",
      });
    }

    const file = formData.find((item) => item.name === "file");
    if (!file || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file found in upload",
      });
    }

    // Load JSZip
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file.data);

    // Check required files exist
    const registryFile = zipContent.file("registry.json");
    const pluginFile = zipContent.file("plugin.vue");

    if (!registryFile) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing registry.json file in plugin zip",
      });
    }

    if (!pluginFile) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing plugin.vue file in plugin zip",
      });
    }

    // Parse registry.json
    const registryContent = await registryFile.async("text");
    let registry: PluginRegistry;

    try {
      registry = JSON.parse(registryContent);
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid JSON format in registry.json",
      });
    }

    // Validate registry structure
    if (!registry.id || typeof registry.id !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing or invalid plugin id in registry.json",
      });
    }

    if (!registry.type || !["component", "page"].includes(registry.type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid plugin type. Must be "component" or "page"',
      });
    }

    if (typeof registry.active !== "boolean") {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing or invalid active status in registry.json",
      });
    }

    // Validate plugin ID format
    const idPattern = /^[a-z0-9-_]+$/;
    if (!idPattern.test(registry.id)) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Plugin ID must contain only lowercase letters, numbers, hyphens, and underscores",
      });
    }

    if (registry.id.includes(" ")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Plugin ID cannot contain spaces",
      });
    }

    // Remove URL validation - URL will be auto-generated on client side

    // Validate page registration
    if (registry.type === "page") {
      if (!registry.registration) {
        throw createError({
          statusCode: 400,
          statusMessage: "Page plugins must have registration object",
        });
      }

      // Check validation: menuItem is required, miniSidebar is optional
      const hasMenuItemFormat = registry.registration.menuItem;
      const hasLegacyFormat =
        registry.registration.routePattern && registry.registration.title;

      if (!hasMenuItemFormat && !hasLegacyFormat) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "Page plugins must have either (menuItem) or (routePattern + title)",
        });
      }

      // Validate menuItem format
      if (hasMenuItemFormat) {
        const { miniSidebar, menuItem } = registry.registration;

        // Validate miniSidebar if present (optional)
        if (
          miniSidebar &&
          (!miniSidebar?.id || !miniSidebar?.label || !miniSidebar?.route)
        ) {
          throw createError({
            statusCode: 400,
            statusMessage: "miniSidebar must have id, label, and route",
          });
        }

        // Validate menuItem (required)
        if (!menuItem?.label || !menuItem?.route || !menuItem?.sidebarId) {
          throw createError({
            statusCode: 400,
            statusMessage: "menuItem must have label, route, and sidebarId",
          });
        }
      }

      // Validate legacy format
      if (
        hasLegacyFormat &&
        (!registry.registration.routePattern || !registry.registration.title)
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: "Legacy format requires both routePattern and title",
        });
      }
    }

    // Check if plugin already exists before processing
    const publicDir = join(process.cwd(), "public");
    const pluginDir = join(publicDir, "plugins", registry.id);
    const isUpdate = existsSync(pluginDir);

    // All validation passed, now process the plugin
    await processPlugin(registry, zipContent);

    return {
      success: true,
      message: isUpdate
        ? "Plugin updated successfully"
        : "Plugin installed successfully",
      plugin: {
        id: registry.id,
        type: registry.type,
        description: registry.description || registry.id,
      },
      action: isUpdate ? "updated" : "installed",
    };
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Generic error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to process plugin upload",
    });
  }
});
