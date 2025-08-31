
export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  const { setConfig } = useEnfyraConfig();

  setConfig({
    apiUrl: "http://localhost:3000",
    apiPrefix: runtimeConfig.public.apiPrefix,
  });
});
