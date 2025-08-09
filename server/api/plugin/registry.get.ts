import { readFile } from "fs/promises";
import { join } from "path";

export default defineEventHandler(async (event) => {
  // Public endpoint - không cần authentication

  try {
    // Read registry file
    const registryPath = join(
      process.cwd(),
      "public",
      "plugins",
      "plugin-registry.json"
    );
    const registryContent = await readFile(registryPath, "utf-8");
    const registry = JSON.parse(registryContent);

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
