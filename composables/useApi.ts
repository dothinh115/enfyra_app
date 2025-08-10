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

interface BackendError {
  success: false;
  message: string;
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
    method: string;
    correlationId?: string;
  };
}

function handleApiError(error: any, context?: string) {
  let message = "Request failed";
  let errorCode = "UNKNOWN_ERROR";
  let correlationId: string | undefined;

  // Handle backend error response format
  if (error?.response?.data) {
    const responseData = error.response.data as BackendError;
    if (responseData.error) {
      message =
        responseData.error.message || responseData.message || "Request failed";
      errorCode = responseData.error.code;
      correlationId = responseData.error.correlationId;
    } else {
      message = responseData.message || "Request failed";
    }
  } else if (error?.data) {
    const errorData = error.data as BackendError;
    if (errorData.error) {
      message =
        errorData.error.message || errorData.message || "Request failed";
      errorCode = errorData.error.code;
      correlationId = errorData.error.correlationId;
    } else {
      message = errorData.message || "Request failed";
    }
  } else if (error?.message) {
    message = error.message;
  }

  const toast = useToast();
  toast.add({
    title: getErrorTitle(errorCode),
    description: message,
    icon: getErrorIcon(errorCode),
    color: "error",
  });
}

function getErrorTitle(errorCode: string): string {
  const titleMap: Record<string, string> = {
    AUTHENTICATION_ERROR: "Authentication Error",
    AUTHORIZATION_ERROR: "Access Denied",
    VALIDATION_ERROR: "Validation Error",
    RESOURCE_NOT_FOUND: "Not Found",
    DUPLICATE_RESOURCE: "Duplicate Entry",
    DATABASE_ERROR: "Database Error",
    SCRIPT_EXECUTION_ERROR: "Script Error",
    RATE_LIMIT_EXCEEDED: "Rate Limit Exceeded",
  };

  return titleMap[errorCode] || "Error";
}

function getErrorIcon(errorCode: string): string {
  const iconMap: Record<string, string> = {
    AUTHENTICATION_ERROR: "lucide:lock",
    AUTHORIZATION_ERROR: "lucide:shield-x",
    VALIDATION_ERROR: "lucide:alert-triangle",
    RESOURCE_NOT_FOUND: "lucide:search-x",
    DUPLICATE_RESOURCE: "lucide:copy-x",
    DATABASE_ERROR: "lucide:database",
    SCRIPT_EXECUTION_ERROR: "lucide:code",
    RATE_LIMIT_EXCEEDED: "lucide:clock-x",
  };

  return iconMap[errorCode] || "lucide:alert-circle";
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

  const execute = async (executeOpts?: {
    body?: any;
    id?: string | number;
  }) => {
    pending.value = true;
    error.value = null;

    try {
      const finalBody = executeOpts?.body || unref(body);
      const finalQuery = unref(query);

      // Build final path with optional ID
      const finalPath = executeOpts?.id
        ? `${computedPath.value}/${executeOpts.id}`
        : computedPath.value;

      // Call useFetch when execute is called
      const { data: fetchData, error: fetchError } = await useFetch<T>(
        finalPath,
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

  const execute = async (executeOpts?: {
    body?: any;
    id?: string | number;
  }) => {
    pending.value = true;
    error.value = null;

    try {
      const basePath = path().replace(/^\/?api\/?/, "");
      const finalPath = executeOpts?.id
        ? `${basePath}/${executeOpts.id}`
        : basePath;
      const finalBody = executeOpts?.body || unref(body);
      const finalQuery = unref(query);

      const response = await $fetch<T>(finalPath, {
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
