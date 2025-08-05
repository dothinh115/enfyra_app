import { useApi, useApiLazy } from "./useApi";

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

export function useApiWithError<T = any>(path: string, opts: any = {}) {
  const { errorContext, ...apiOpts } = opts;
  const result = useApi<T>(path, apiOpts);

  watch(
    () => result.error.value,
    (error) => {
      if (error) {
        handleApiError(error, errorContext);
      }
    }
  );

  return result;
}

export async function useApiLazyWithError<T = any>(
  path: string,
  opts: any = {}
) {
  const { errorContext, ...apiOpts } = opts;

  const result = await useApiLazy<T>(path, apiOpts);

  if (result.error.value) {
    handleApiError(result.error.value, errorContext);
  }

  return result;
}
