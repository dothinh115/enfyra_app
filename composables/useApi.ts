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
    ...(defaultFn ? { default: defaultFn as any } : {}),
  });
}

export async function useApiLazy<T = any>(
  path: string,
  opts: UseApiOptions<T> = {}
) {
  const headers = useRequestHeaders(["cookie", "authorization"]);
  const runtimeConfig = useRuntimeConfig();
  const { apiPrefix } = runtimeConfig.public;
  const { method, body, query } = opts;

  const cleanPath = path.replace(/^\/?api\/?/, "");

  try {
    const res: any = await $fetch<T>(cleanPath, {
      baseURL: apiPrefix,
      method,
      body,
      headers,
      query,
    });
    return {
      data: ref(res),
      error: ref(null),
      pending: false,
      refresh: async () => res,
    };
  } catch (error: any) {
    return {
      data: ref(null),
      error: ref<any>(error.data),
      pending: false,
      refresh: async () => null,
    };
  }
}
