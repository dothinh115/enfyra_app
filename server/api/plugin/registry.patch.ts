import {
  readPluginRegistry,
  writePluginRegistry,
} from "../../../utils/server/plugin-registry";
import { checkPluginPermission } from "../../../utils/auth/check-permissions";

export default defineEventHandler(async (event) => {
  // Check PATCH permission for plugin registry
  await checkPluginPermission(event, "PATCH");

  const body = await readBody(event);
  const { pluginId, updates } = body;

  if (!pluginId || !updates) {
    throw createError({
      statusCode: 400,
      statusMessage: "Plugin ID and updates required",
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

    // Update plugin with provided updates
    registry.plugins[pluginIndex] = {
      ...registry.plugins[pluginIndex],
      ...updates,
    };

    // Write updated registry back to file
    await writePluginRegistry(registry);

    return {
      success: true,
      message: `Plugin ${pluginId} updated successfully`,
      plugin: registry.plugins[pluginIndex],
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to update plugin: ${error.message}`,
    });
  }
});
