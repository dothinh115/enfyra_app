import { readPluginRegistry } from "../../../utils/server/plugin-registry";

export default defineEventHandler(async (event) => {
  // Public endpoint - không cần authentication

  try {
    // Read registry with auto-creation if missing
    const registry = await readPluginRegistry();

    // Force no-cache headers
    setHeader(
      event,
      "Cache-Control",
      "no-cache, no-store, must-revalidate, private"
    );
    setHeader(event, "Pragma", "no-cache");
    setHeader(event, "Expires", "0");

    return registry;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch plugin registry: ${error.message}`,
    });
  }
});
