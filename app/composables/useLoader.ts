export const useLoader = () => {
  const createLoader = () => {
    // Sử dụng local ref thay vì useState để tránh circular dependency
    const loadingState = ref(false);

    const isLoading = computed(() => loadingState.value);

    const startLoading = () => {
      loadingState.value = true;
    };
    const stopLoading = () => {
      loadingState.value = false;
    };

    const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
      startLoading();
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    };

    return {
      isLoading,
      startLoading,
      stopLoading,
      withLoading,
    };
  };

  return {
    createLoader,
  };
};
