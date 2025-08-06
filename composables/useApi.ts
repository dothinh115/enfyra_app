type HttpMethod = "get" | "post" | "delete" | "patch";
interface UseApiOptions<T> {
  method?: HttpMethod;
  body?: any;
  query?: Record<string, any> | ComputedRef<Record<string, any>>;
  server?: boolean;
  errorContext?: string;
  default?: () => T | Ref<T>;
  immediate?: boolean;
  watch?: boolean;
}

function handleApiError(error: any, context?: string) {
  console.error(`API Error${context ? ` in ${context}` : ""}:`, error);

  let message = "Request failed";

  if (error?.response?.data) {
    const responseData = error.response.data;
    message = responseData.message || responseData.error || "Request failed";
  } else if (error?.data) {
    message = error.data.message || error.data.error || "Request failed";
  } else if (error?.message) {
    message = error.message;
  }

  const toast = useToast();
  toast.add({
    title: "Error",
    description: message,
    icon: "lucide:alert-circle",
    color: "error",
  });
}

export function useApi<T = any>(
  path: () => string,
  opts: UseApiOptions<T> = {}
) {
  const headers = useRequestHeaders(["cookie", "authorization"]);
  const runtimeConfig = useRuntimeConfig();
  const { apiPrefix } = runtimeConfig.public;
  const { method = "get", body, query, errorContext, immediate = true } = opts;

  const data = ref<T | null>(null);
  const error = ref<any>(null);
  const pending = ref(false);

  const computedPath = computed(() => {
    const rawPath = path();
    return rawPath.replace(/^\/?api\/?/, "");
  });

  const execute = async (executeOpts?: { body?: any }) => {
    pending.value = true;
    error.value = null;

    try {
      const finalBody = executeOpts?.body || unref(body);
      const finalQuery = unref(query);

      // Call useFetch when execute is called
      const { data: fetchData, error: fetchError } = await useFetch<T>(
        computedPath,
        {
          baseURL: apiPrefix,
          method: method as any,
          body: finalBody ? toRaw(finalBody) : undefined,
          headers,
          query: finalQuery,
          server: false,
        }
      );

      if (fetchError.value) {
        error.value = fetchError.value;
        handleApiError(fetchError.value, errorContext);
        throw fetchError.value;
      }

      data.value = fetchData.value;
      return fetchData.value;
    } catch (err) {
      error.value = err;
      handleApiError(err, errorContext);
      throw err;
    } finally {
      pending.value = false;
    }
  };

  // Auto-execute if immediate is true
  if (immediate) {
    execute();
  }

  return {
    data: readonly(data),
    error: readonly(error),
    pending: readonly(pending),
    execute,
  };
}

export function useApiLazy<T = any>(
  path: () => string,
  opts: UseApiOptions<T> = {}
) {
  const headers = useRequestHeaders(["cookie", "authorization"]);
  const runtimeConfig = useRuntimeConfig();
  const { apiPrefix } = runtimeConfig.public;
  const { method = "get", body, query, errorContext } = opts;

  const data = ref<T | null>(null);
  const error = ref<any>(null);
  const pending = ref(false);

  const execute = async (executeOpts?: { body?: any }) => {
    pending.value = true;
    error.value = null;

    try {
      const computedPath = path().replace(/^\/?api\/?/, "");
      const finalBody = executeOpts?.body || unref(body);
      const finalQuery = unref(query);

      const response = await $fetch<T>(computedPath, {
        baseURL: apiPrefix,
        method: method as any,
        body: finalBody ? toRaw(finalBody) : undefined,
        headers,
        query: finalQuery,
      });

      data.value = response;
      return response;
    } catch (err) {
      error.value = err;
      handleApiError(err, errorContext);
      throw err;
    } finally {
      pending.value = false;
    }
  };

  return {
    data: readonly(data),
    error: readonly(error),
    pending: readonly(pending),
    execute,
  };
}
