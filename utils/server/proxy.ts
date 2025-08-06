import { H3Event, proxyRequest } from "h3";
import { useRuntimeConfig } from "#imports";

/**
 * Utility function to proxy requests to the backend API
 * @param event H3 event object
 * @param customPath Optional custom path override
 * @returns Promise from proxyRequest
 */
export function proxyToAPI(event: H3Event, customPath?: string) {
  const config = useRuntimeConfig();
  const apiPrefix = config.public.apiPrefix || "/api";
  
  const rawPath = customPath || event.path.replace(new RegExp(`^${apiPrefix}`), "");
  const targetUrl = `${config.public.apiUrl}${rawPath}`;
  
  const headers = event.context.proxyHeaders || {};
  
  return proxyRequest(event, targetUrl, {
    headers,
  });
}