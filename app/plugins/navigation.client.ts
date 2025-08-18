import CommonBreadCrumbs from "~/components/common/BreadCrumbs.vue";

export default defineNuxtPlugin(() => {
  const route = useRoute();
  const router = useRouter();
  const { isTablet } = useScreen();

  // Calculate breadcrumb segments from route
  const breadcrumbSegments = computed(() => {
    const parts = route.path.split("/").filter(Boolean);

    return parts.map((part, i) => {
      const label = decodeURIComponent(part);
      const to = "/" + parts.slice(0, i + 1).join("/");
      return { label, to };
    });
  });

  // Check if we can go back (not on root level)
  const canGoBack = computed(() => breadcrumbSegments.value.length > 1);

  // Back button handler
  const goBack = () => {
    router.back();
  };

  // Register global actions once with reactive props (persistent across routes)
  useSubHeaderActionRegistry([
    {
      id: "navigation-back-button",
      label: "Back",
      icon: "lucide:arrow-left",
      variant: "soft",
      color: "primary",
      get size() {
        return isTablet.value ? "sm" : "md";
      },
      side: "left",
      get disabled() {
        return !canGoBack.value;
      },
      onClick: goBack,
      global: true, // Persist across route changes
      permission: {
        allowAll: true, // Always show back button
      },
    },
  ]);

  useHeaderActionRegistry([
    {
      id: "navigation-breadcrumbs",
      component: CommonBreadCrumbs,
      side: "left",
      get props() {
        return {
          segments: breadcrumbSegments.value,
        };
      },
      get key() {
        return `breadcrumbs-${route.path}`;
      },
      global: true, // Persist across route changes
      permission: {
        allowAll: true, // Always show breadcrumbs
      },
    },
  ]);
});
