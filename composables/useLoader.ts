export const useLoader = () => {
  const createLoader = () => {
    // Tạo UUID duy nhất cho mỗi loader
    const loaderId = crypto.randomUUID();

    // Sử dụng useState trực tiếp thay vì useGlobalState để tránh circular dependency
    const loadingState = useState<boolean>(`loader:${loaderId}`, () => false);

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
