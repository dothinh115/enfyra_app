import {
  autoAssignExtensionName,
  buildExtensionWithVite,
} from "~/utils/extension";

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

      // Check if body contains 'code' field that needs compilation
      if (body && body.code && typeof body.code === "string") {
        // Get extension ID from body
        const extensionId = body.id || body.name || "extension_" + Date.now();

        try {
          // Compile Vue SFC to JavaScript with Vite
          compiledCode = await buildExtensionWithVite(
            extensionId,
            body.code,
            body.extensionId
          );

          // Replace the code field with compiled JavaScript
          body.code = compiledCode;

          // Update rawBody with new compiled body
          rawBody = JSON.stringify(body);
        } catch (compileError: any) {
          // If compilation fails, silently skip and keep the original code
          // This handles cases where code was already compiled before
          console.warn(
            `Extension compilation failed for ${extensionId}, keeping original code:`,
            compileError.message
          );

          // Keep the original body unchanged
          rawBody = JSON.stringify(body);
        }
      } else if (body) {
        // If no compilation needed, use original body as rawBody
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
