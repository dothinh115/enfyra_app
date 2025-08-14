import {
  autoAssignExtensionName,
  buildExtensionWithVite,
  isProbablyVueSFC,
  assertValidVueSFC,
  assertValidJsBundleSyntax,
} from "~/utils/server/extension";

export default defineEventHandler(async (event) => {
  const method = event.method;

  try {
    let body = null;
    let compiledCode = null;
    let rawBody = null;

    // Only read body for POST/PATCH requests
    if (method === "POST" || method === "PATCH") {
      body = await readBody(event);

      // Tự động đặt tên extension nếu chưa có
      body = autoAssignExtensionName(body);

      rawBody = await readRawBody(event, false);

      // Check if body contains 'code' field that needs compilation or validation
      if (body && typeof body.code === "string") {
        const code: string = body.code;
        const extensionId = body.id || body.name || "extension_" + Date.now();

        if (isProbablyVueSFC(code)) {
          // Validate SFC syntax before building
          assertValidVueSFC(code);

          // Build; if build fails, throw 400, do NOT proxy
          try {
            compiledCode = await buildExtensionWithVite(code, body.extensionId);
          } catch (compileError: any) {
            throw createError({
              statusCode: 400,
              statusMessage:
                compileError?.statusMessage ||
                `Failed to build Vue SFC for ${extensionId}: ${
                  compileError?.message || "Unknown error"
                }`,
            });
          }

          body.compiledCode = compiledCode;
          rawBody = JSON.stringify(body);
        } else {
          // Treat as compiled bundle; validate syntax first
          assertValidJsBundleSyntax(code);
          // Pass-through unchanged
          rawBody = JSON.stringify(body);
        }
      } else if (body) {
        rawBody = JSON.stringify(body);
      }
    }

    // Make API call to backend
    const config = useRuntimeConfig();
    const apiPath = event.path.replace("/api", "");
    const targetUrl = `${config.public.apiUrl}${apiPath}`;

    const response = await $fetch(targetUrl, {
      method: method as any,
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
