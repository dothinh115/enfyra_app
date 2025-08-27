import { defineEventHandler } from "h3";
import { refreshToken } from "../../app/utils/server/auth/refresh-token";

export default defineEventHandler(async (event) => {
  // ✅ Build headers manually from raw request
  const headers: Record<string, string> = {};
  Object.entries(event.node.req.headers).forEach(([key, value]) => {
    if (
      ["host", "content-length", "connection", "accept-encoding"].includes(key)
    )
      return;
    if (typeof value === "string") headers[key] = value;
    else if (Array.isArray(value)) headers[key] = value.join(",");
  });

  // ✅ Refresh token if needed
  const newAccessToken = await refreshToken(event);

  if (newAccessToken) {
    headers.authorization = `Bearer ${newAccessToken}`;
  }
  event.context.proxyHeaders = headers;
});
