import { defineEventHandler, getCookie, H3Event } from "h3";
import { useRuntimeConfig } from "#imports";
import { ACCESS_TOKEN_KEY } from "../../utils/constants";

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig();

  // ✅ Kiểm tra access_token trong cookie
  const accessToken = getCookie(event, ACCESS_TOKEN_KEY);
  if (!accessToken) return null;

  const apiPrefix = config.public.apiPrefix || "/api";
  const rawPath = event.path.replace(new RegExp(`^${apiPrefix}`), "");
  const targetUrl = `${config.public.apiUrl}${rawPath}`;

  const headers = event.context.proxyHeaders || {};

  return proxyRequest(event, targetUrl, {
    headers,
  });
});
