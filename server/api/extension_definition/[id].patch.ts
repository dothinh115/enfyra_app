import {
  autoAssignExtensionName,
  buildExtensionWithVite,
} from "~/utils/extension";

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

      // Check if body contains 'code' field that needs compilation
      if (body && body.code && typeof body.code === "string") {
        // Get extension ID from path or body
        const pathParts = event.path.split("/");
        const extensionId =
          pathParts[pathParts.length - 1] ||
          body.id ||
          body.name ||
          "extension_" + Date.now();

        // For page extensions, use a default name to ensure consistency
        // All page extensions will have the same component name for easy finding
        let componentName = "Extension";
        if (body.type === "page") {
          componentName = "Extension";
        } else {
          // For other types, use extension ID (future support)
          componentName = `Extension_${body.id || extensionId}`;
        }

        console.log("Path parts:", pathParts);
        console.log("Extension type:", body.type);
        console.log("Component name for compilation:", componentName);
        console.log("Body ID:", body.id);
        console.log("Body name:", body.name);

        try {
          // Compile Vue SFC to JavaScript with Vite
          compiledCode = await buildExtensionWithVite(
            body.code,
            body.extensionId
          );

          // Replace the code field with compiled JavaScript
          body.code = compiledCode;
        } catch (compileError: any) {
          // If compilation fails, silently skip and keep the original code
          // This handles cases where code was already compiled before
          console.warn(
            `Extension compilation failed for ${extensionId}, keeping original code:`,
            compileError.message
          );

          // Remove the code field from body to keep original code unchanged
          delete body.code;
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
