import { readFile } from "fs/promises";
import { join } from "path";
import { checkAccessToken } from "../../../utils/auth/check-permissions";

export default defineEventHandler(async (event) => {
  // Chỉ cần check access token (không cần rootAdmin vì file JS standalone không thể chạy được)
  await checkAccessToken(event);

  const path = getRouterParam(event, "path");

  if (!path) {
    throw createError({ statusCode: 400, statusMessage: "Path required" });
  }

  // Ngăn chặn path traversal
  if (path.includes("..") || path.includes("~")) {
    throw createError({ statusCode: 400, statusMessage: "Invalid path" });
  }

  // Chỉ cho phép truy cập files .js
  if (!path.endsWith(".js")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Only JavaScript files are allowed",
    });
  }

  try {
    // Read plugin file from public directory
    const filePath = join(process.cwd(), "public", "plugins", path);

    // Đảm bảo file path nằm trong thư mục plugins (additional security)
    const pluginsDir = join(process.cwd(), "public", "plugins");
    if (!filePath.startsWith(pluginsDir)) {
      throw createError({ statusCode: 403, statusMessage: "Access denied" });
    }

    const content = await readFile(filePath, "utf-8");

    // Validate content is JavaScript
    if (content.trim().startsWith("<")) {
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
