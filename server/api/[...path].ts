import { defineEventHandler, proxyRequest, H3Event } from "h3";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig();
  const apiPrefix = config.public.apiPrefix || "/api";
  const rawPath = event.path.replace(new RegExp(`^${apiPrefix}`), "");
  const targetUrl = `${config.public.apiUrl}${rawPath}`;

  const headers = event.context.proxyHeaders || {};

  return proxyRequest(event, targetUrl, {
    headers,
  });
});
