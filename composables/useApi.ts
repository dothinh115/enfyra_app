type HttpMethod = "get" | "post" | "delete" | "patch";

interface UseApiOptions<T> {
  method?: HttpMethod;
  body?: any;
  query?: Record<string, any>;
  immediate?: boolean;
  default?: () => T | Ref<T>;
}

export function useApi<T = any>(path: string, opts: UseApiOptions<T> = {}) {
  const headers = useRequestHeaders(["cookie", "authorization"]);
  const runtimeConfig = useRuntimeConfig();
  const { apiPrefix } = runtimeConfig.public;
  const { method, body, query, immediate = true, default: defaultFn } = opts;

  const cleanPath = path.replace(/^\/?api\/?/, "");

  return useFetch<T>(cleanPath, {
    baseURL: apiPrefix,
    method: method as any,
    body,
    headers,
    query,
    immediate,
    transform: (response: any) => response?.data ?? response,
    ...(defaultFn ? { default: defaultFn as any } : {}),
  });
}
