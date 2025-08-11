import {
  autoAssignExtensionName,
  buildExtensionWithVite,
  isProbablyVueSFC,
  assertValidVueSFC,
  assertValidJsBundleSyntax,
} from "~/utils/extension";
import { readBody, getHeader } from "h3";

export default defineEventHandler(async (event) => {
  const method = event.method;

  try {
    let body = null;
    let compiledCode = null;

    // Only read body for POST/PATCH requests
    if (method === "POST" || method === "PATCH") {
      body = await readBody(event);

      // Tự động đặt tên extension nếu chưa có
      body = autoAssignExtensionName(body);

      // Check if body contains 'code' field that needs compilation or validation
      if (body && typeof body.code === "string") {
        const code: string = body.code;

        if (isProbablyVueSFC(code)) {
          // Validate SFC syntax before building
          assertValidVueSFC(code);
          try {
            compiledCode = await buildExtensionWithVite(code, body.extensionId);
          } catch (compileError: any) {
            throw createError({
              statusCode: 400,
              statusMessage:
                compileError?.statusMessage ||
                `Failed to build Vue SFC for ${body.extensionId}: ${
                  compileError?.message || "Unknown error"
                }`,
            });
          }
          body.code = compiledCode;
        } else {
          // Validate compiled bundle syntax
          await assertValidJsBundleSyntax(code);
          // Leave as-is
        }
      }
    }

    // Make API call to backend
    const config = useRuntimeConfig();
    const apiPath = event.path.replace("/api", "");
    const targetUrl = `${config.public.apiUrl}${apiPath}`;

    const response = await $fetch(targetUrl, {
      method: "PATCH",
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
