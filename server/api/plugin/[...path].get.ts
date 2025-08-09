import { readFile } from "fs/promises";
import { join } from "path";

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "path");

  if (!path) {
    throw createError({ statusCode: 400, statusMessage: "Path required" });
  }

  try {
    // Read plugin file from public directory
    const filePath = join(process.cwd(), "public", "plugins", path);

    // Debug logging
    console.log(`Loading plugin from: ${filePath}`);

    const content = await readFile(filePath, "utf-8");

    // Validate content is JavaScript
    if (content.trim().startsWith("<")) {
      console.error(
        `Plugin file contains HTML instead of JavaScript: ${filePath}`
      );
      throw createError({
        statusCode: 500,
        statusMessage: `Invalid plugin file format: ${path}`,
      });
    }

    // Force no-cache headers
    setHeader(
      event,
      "Cache-Control",
      "no-cache, no-store, must-revalidate, private"
    );
    setHeader(event, "Pragma", "no-cache");
    setHeader(event, "Expires", "0");
    setHeader(event, "Content-Type", "application/javascript; charset=utf-8");

    return content;
  } catch (error: any) {
    console.error(`Plugin load error for ${path}:`, error);
    throw createError({
      statusCode: 404,
      statusMessage: `Plugin not found: ${path}`,
    });
  }
});
