import { readFile } from "fs/promises";
import { join } from "path";
import { getCookie } from "h3";
import { ACCESS_TOKEN_KEY } from "../../../utils/constants";

export default defineEventHandler(async (event) => {
  // Check authentication via access token in cookie
  const accessToken = getCookie(event, ACCESS_TOKEN_KEY);
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

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
