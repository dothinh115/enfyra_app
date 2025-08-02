export const useButtonLoading = () => {
  const { getButtonLoading, setButtonLoading } = useGlobalState();

  const createButtonLoader = (buttonId: string) => {
    const isLoading = computed(() => getButtonLoading(buttonId));
    
    const startLoading = () => setButtonLoading(buttonId, true);
    const stopLoading = () => setButtonLoading(buttonId, false);
    
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
      withLoading
    };
  };

  return {
    createButtonLoader
  };
};