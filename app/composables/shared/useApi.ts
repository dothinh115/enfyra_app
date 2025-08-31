import { useLoader } from "../dynamic/useLoader";

// Extend ApiOptions for useApi-specific features
interface UseApiOptions<T>
  extends Omit<ApiOptions<T>, "lazy" | "transform" | "default"> {
  watch?: boolean;
  disableBatch?: boolean;
  default?: () => T | Ref<T>;
}

interface BackendErrorExtended extends BackendError {
  success: false;
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
    const responseData = error.response.data as BackendErrorExtended;
    if (responseData.error) {
      message =
        responseData.error.message || responseData.message || "Request failed";
      errorCode = responseData.error.code;
      correlationId = responseData.error.correlationId;
    } else {
      message = responseData.message || "Request failed";
    }
  } else if (error?.data) {
    const errorData = error.data as BackendErrorExtended;
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
  path: (() => string) | string,
  opts: UseApiOptions<T> = {}
) {
  const headers = useRequestHeaders(["cookie", "authorization"]);
  const runtimeConfig = useRuntimeConfig();
  const { apiPrefix } = runtimeConfig.public;
  const { method = "get", body, query, errorContext, immediate = true } = opts;

  const data = ref<T | null>(null);
  const error = ref<any>(null);
  const { createLoader } = useLoader();
  const loader = createLoader();

  const computedPath = computed(() => {
    const rawPath = typeof path === 'function' ? path() : path;
    return rawPath.replace(/^\/?api\/?/, "");
  });

  const execute = async (executeOpts?: {
    body?: any;
    id?: string | number;
    ids?: (string | number)[];
    files?: any[];
  }) => {
    loader.startLoading();
    error.value = null;

    try {
      const finalBody = executeOpts?.body || unref(body);
      const finalQuery = unref(query);

      // Batch operation with multiple IDs (only for patch and delete)
      if (
        executeOpts?.ids &&
        executeOpts.ids.length > 0 &&
        (method === "patch" || method === "delete")
      ) {
        const promises = executeOpts.ids.map(async (id) => {
          const finalPath = `${computedPath.value}/${id}`;
          return useFetch<T>(finalPath, {
            baseURL: apiPrefix,
            method: method as any,
            body: finalBody ? toRaw(finalBody) : undefined,
            headers,
            query: finalQuery,
            server: false,
          });
        });

        const responses = await Promise.all(promises);
        const results = responses.map((r) => r.data.value);
        data.value = results as T;
        return results;
      }

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
      loader.stopLoading();
    }
  };

  // Auto-execute if immediate is true
  if (immediate) {
    execute();
  }

  return {
    data: readonly(data),
    error: readonly(error),
    pending: loader.isLoading,
    execute,
  };
}

export function useApiLazy<T = any>(
  path: (() => string) | string,
  opts: UseApiOptions<T> = {}
) {
  const headers = useRequestHeaders(["cookie", "authorization"]);
  const runtimeConfig = useRuntimeConfig();
  const { apiPrefix } = runtimeConfig.public;
  const { method = "get", body, query, errorContext } = opts;

  const data = ref<T | null>(null);
  const error = ref<any>(null);
  const { createLoader } = useLoader();
  const loader = createLoader();

  const execute = async (executeOpts?: {
    body?: any;
    id?: string | number;
    ids?: (string | number)[];
    files?: any[];
  }) => {
    loader.startLoading();
    error.value = null;

    try {
      const basePath = (typeof path === 'function' ? path() : path).replace(/^\/?api\/?/, "");
      const finalBody = executeOpts?.body || unref(body);
      const finalQuery = unref(query);

      // Batch operation with multiple IDs (only for patch and delete)
      if (
        !opts.disableBatch &&
        executeOpts?.ids &&
        executeOpts.ids.length > 0 &&
        (method === "patch" || method === "delete")
      ) {
        const promises = executeOpts.ids.map(async (id) => {
          const finalPath = `${basePath}/${id}`;
          return $fetch<T>(finalPath, {
            baseURL: apiPrefix,
            method: method as any,
            body: finalBody ? toRaw(finalBody) : undefined,
            headers,
            query: finalQuery,
          });
        });

        const responses = await Promise.all(promises);
        data.value = responses as T;
        return responses;
      }

      // Batch operation with files array for POST method
      if (
        !opts.disableBatch &&
        method === "post" &&
        executeOpts?.files &&
        Array.isArray(executeOpts.files) &&
        executeOpts.files.length > 0
      ) {
        const promises = executeOpts.files.map(async (fileObj: any) => {
          return $fetch<T>(basePath, {
            baseURL: apiPrefix,
            method: method as any,
            body: fileObj, // {file: file1, folder: null}
            headers,
            query: finalQuery,
          });
        });

        const responses = await Promise.all(promises);
        data.value = responses as T;
        return responses;
      }

      // Single operation with single ID
      const finalPath = executeOpts?.id
        ? `${basePath}/${executeOpts.id}`
        : basePath;

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
      return null;
    } finally {
      loader.stopLoading();
    }
  };

  return {
    data,
    error: readonly(error),
    pending: loader.isLoading,
    execute,
  };
}
