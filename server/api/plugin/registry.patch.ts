import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { getCookie } from "h3";
import { ACCESS_TOKEN_KEY } from "../../../utils/constants";

export default defineEventHandler(async (event) => {
  // Check authentication via access token in cookie
  const accessToken = getCookie(event, ACCESS_TOKEN_KEY);
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

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
    const registryPath = join(
      process.cwd(),
      "public",
      "plugins",
      "plugin-registry.json"
    );
    const registryContent = await readFile(registryPath, "utf-8");
    const registry = JSON.parse(registryContent);

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
    await writeFile(registryPath, JSON.stringify(registry, null, 2), "utf-8");

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
