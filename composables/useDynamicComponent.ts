import { markRaw } from "vue";
import {
  UIcon,
  UButton,
  UCard,
  UBadge,
  UInput,
  UTextarea,
  USelect,
  UCheckbox,
  USwitch,
  UModal,
  UPopover,
  UTooltip,
  UAlert,
  UAvatar,
  UProgress,
  UTable,
  UPagination,
  UBreadcrumb,
  UTabs,
  UAccordion,
  UForm,
  CommonLoadingState,
  CommonEmptyState,
  CommonSettingsCard,
  PermissionGate,
  FormEditor,
  CommonUploadModal,
  DynamicWidgetComponent,
  FilterDrawer,
} from "#components";

import {
  // Enfyra composables
  useApi,
  useApiLazy,
  useHeaderActionRegistry,
  useSchema,
  useScreen,
  useGlobalState,
  useConfirm,
  useAuth,
  usePermissions,
  useFilterQuery,

  // Nuxt composables
  useToast,
  useState,
  useRoute,
  useRouter,
  useCookie,
  useNuxtApp,
  navigateTo,
  useFetch,
  useAsyncData,
  useLazyFetch,
  useHead,
  useSeoMeta,
} from "#imports";

import {
  EXTENSION_COMPOSABLES,
  EXTENSION_VUE_FUNCTIONS,
  createComposableMap,
} from "~/utils/extension/globals";

/**
 * Composable for loading dynamic Vue components from code
 */
export const useDynamicComponent = () => {
  // Get components directly imported
  const availableComponents = {
    // UI Components
    UIcon: markRaw(UIcon),
    UButton: markRaw(UButton),
    UCard: markRaw(UCard),
    UBadge: markRaw(UBadge),
    UInput: markRaw(UInput),
    UTextarea: markRaw(UTextarea),
    USelect: markRaw(USelect),
    UCheckbox: markRaw(UCheckbox),
    USwitch: markRaw(USwitch),
    UModal: markRaw(UModal),
    UPopover: markRaw(UPopover),
    UTooltip: markRaw(UTooltip),
    UAlert: markRaw(UAlert),
    UAvatar: markRaw(UAvatar),
    UProgress: markRaw(UProgress),
    UTable: markRaw(UTable),
    UPagination: markRaw(UPagination),
    UBreadcrumb: markRaw(UBreadcrumb),
    UTabs: markRaw(UTabs),
    UAccordion: markRaw(UAccordion),
    UForm: markRaw(UForm),

    // Core Components
    PermissionGate: markRaw(PermissionGate),
    FormEditor: markRaw(FormEditor),

    // Filter Components
    FilterDrawer: markRaw(FilterDrawer),

    // Common Components
    CommonLoadingState: markRaw(CommonLoadingState),
    CommonEmptyState: markRaw(CommonEmptyState),
    CommonSettingsCard: markRaw(CommonSettingsCard),
    CommonUploadModal: markRaw(CommonUploadModal),

    // Dynamic Components
    Widget: markRaw(DynamicWidgetComponent),
  };

  const loadDynamicComponent = async (
    compiledCode: string,
    extensionName: string
  ) => {
    try {
      // Only run on client-side
      if (typeof window === "undefined") {
        throw new Error("Extensions can only be loaded on client-side");
      }

      // 1. Setup globals if not already done
      if (!(window as any).Vue) {
        (window as any).Vue = await import("vue");
      }

      // Inject composables globally
      const g = globalThis as any;

      // Create composables mapping from imports using helper
      const composableMap = createComposableMap({
        useApi,
        useApiLazy,
        useHeaderActionRegistry,
        useSchema,
        useScreen,
        useGlobalState,
        useConfirm,
        useAuth,
        usePermissions,
        useFilterQuery,
        useToast,
        useState,
        useRoute,
        useRouter,
        useCookie,
        useNuxtApp,
        navigateTo,
        useFetch,
        useAsyncData,
        useLazyFetch,
        useHead,
        useSeoMeta,
      });

      // Inject available composables
      Object.entries(composableMap).forEach(([key, composable]) => {
        if (typeof composable === "function") {
          g[key] = composable;
        } else {
          console.warn(`Extension composable ${key} is not a function`);
        }
      });

      // Inject Vue functions dynamically from config
      const vue = await import("vue");
      EXTENSION_VUE_FUNCTIONS.forEach((fnName) => {
        g[fnName] = vue[fnName];
      });

      // 2. Execute the code
      // Sử dụng tên extension được truyền vào để tìm component
      const componentName = extensionName;

      // Clear any existing component with same name
      delete (window as any)[componentName];

      // Create and execute script
      const script = document.createElement("script");
      script.textContent = compiledCode;
      script.type = "text/javascript";

      // Execute script synchronously
      document.head.appendChild(script);

      // Wait a bit for script to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Remove script after execution
      document.head.removeChild(script);

      // Check if component was registered
      const component = (window as any)[componentName];
      if (!component) {
        // No fallback allowed - must match exact component name
        const availableExtensions = Object.keys(window as any).filter(
          (k) =>
            k.startsWith(extensionName) ||
            k.startsWith(extensionName.toLowerCase())
        );

        throw new Error(
          `Component "${componentName}" not found. Expected exact match for extension "${extensionName}". Available extensions: ${availableExtensions.join(
            ", "
          )}`
        );
      }

      // 3. Create wrapper component with injected dependencies
      const wrappedComponent = markRaw({
        ...component,
        components: availableComponents,
      });

      return markRaw(wrappedComponent);
    } catch (error: any) {
      throw new Error(`Failed to load component: ${error?.message || error}`);
    }
  };

  return {
    loadDynamicComponent,
  };
};
