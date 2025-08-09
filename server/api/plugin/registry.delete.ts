import {
  readPluginRegistry,
  writePluginRegistry,
} from "../../../utils/server/plugin-registry";
import { rm } from "fs/promises";
import { join } from "path";
import { checkPluginPermission } from "../../../utils/auth/check-permissions";

export default defineEventHandler(async (event) => {
  // Kiểm tra quyền DELETE cho plugin registry
  await checkPluginPermission(event, "DELETE");

  const body = await readBody(event);
  const { pluginId } = body;

  if (!pluginId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Plugin ID required",
    });
  }

  try {
    // Read current registry
    const registry = await readPluginRegistry();

    // Find plugin
    const pluginIndex = registry.plugins.findIndex(
      (p: any) => p.id === pluginId
    );
    if (pluginIndex === -1) {
      throw createError({ statusCode: 404, statusMessage: "Plugin not found" });
    }

    // Delete plugin files from public directory
    const pluginDir = join(process.cwd(), "public", "plugins", pluginId);
    try {
      await rm(pluginDir, { recursive: true, force: true });
    } catch (fileError) {
      // Log but don't fail - registry removal is more important
      console.warn(
        `Warning: Failed to delete plugin files for ${pluginId}:`,
        fileError
      );
    }

    // Remove plugin from registry
    registry.plugins.splice(pluginIndex, 1);

    // Write updated registry back to file
    await writePluginRegistry(registry);

    return {
      success: true,
      message: `Plugin ${pluginId} deleted successfully`,
      remainingPlugins: registry.plugins.length,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to delete plugin: ${error.message}`,
    });
  }
});
