import { useNuxtApp } from "#app";
import { markRaw } from "vue";
import { useAuth } from "./useAuth";
import { useApi } from "./useApi";
import { useHeaderActionRegistry } from "./useHeaderActionRegistry";
import { useMenuRegistry } from "./useMenuRegistry";
import { useMiniSidebarRegistry } from "./useMiniSidebarRegistry";
import { usePermissions } from "./usePermissions";

/**
 * Composable for loading external Vue components dynamically
 * Simple approach: fetch JS -> inject Nuxt context -> return component
 */
export const useDynamicComponent = () => {
  /**
   * Load external component from URL (UMD format)
   * @param url - URL to the component JS file
   * @param pluginId - Plugin identifier
   * @returns Promise that resolves to Vue component
   */
  const loadExternalComponent = async (url: string, pluginId: string) => {
    try {
      // 1. Inject Nuxt context globally (one time setup)
      if (!window.Vue) {
        const Vue = await import("vue");
        window.Vue = Vue;
      }

      if (!window.__NUXT_APP__) {
        const nuxtApp = useNuxtApp();
        window.__NUXT_APP__ = nuxtApp;

        // Inject all Nuxt composables globally
        const g = globalThis as any;
        g.useState = useState;
        g.useApi = useApi;
        g.useAuth = useAuth;
        g.useToast = () => useToast();
        g.useRouter = () => nuxtApp.$router;
        g.useCookie = useCookie;
        g.useNuxtApp = () => nuxtApp;
        g.navigateTo = navigateTo;
        g.useRoute = useRoute;
        g.useFetch = useFetch;
        g.useAsyncData = useAsyncData;
        g.useLazyFetch = useLazyFetch;
        g.useHead = useHead;
        g.useSeoMeta = useSeoMeta;

        // Inject Enfyra-specific composables
        g.useHeaderActionRegistry = useHeaderActionRegistry;
        g.useMenuRegistry = useMenuRegistry;
        g.useMiniSidebarRegistry = useMiniSidebarRegistry;
        g.usePermissions = usePermissions;

        // Inject Vue lifecycle hooks
        const {
          onMounted,
          onUnmounted,
          onBeforeMount,
          onBeforeUnmount,
          watch,
          computed,
          ref,
          reactive,
          resolveComponent,
        } = await import("vue");
        g.onMounted = onMounted;
        g.onUnmounted = onUnmounted;
        g.onBeforeMount = onBeforeMount;
        g.onBeforeUnmount = onBeforeUnmount;
        g.watch = watch;
        g.computed = computed;
        g.ref = ref;
        g.reactive = reactive;
        g.resolveComponent = resolveComponent;

        // Inject Nuxt UI components via createApp context
        try {
          // Make Vue app available globally for component resolution
          window.__VUE_APP__ = nuxtApp.vueApp;

          // Inject common Nuxt UI components directly
          const { createApp } = await import("vue");

          // Create resolver function for components
          g.resolveUIComponent = (name: string) => {
            const app = window.__VUE_APP__;
            return app?.component(name) || null;
          };

          // Inject specific components that are commonly used
          const uiComponents = [
            "UIcon",
            "UButton",
            "UCard",
            "UBadge",
            "UInput",
            "UTextarea",
            "USelect",
            "UCheckbox",
            "URadio",
            "USwitch",
            "UModal",
            "UPopover",
            "UDropdown",
            "UTooltip",
            "UAlert",
            "UAvatar",
            "UProgress",
            "UTable",
            "UPagination",
            "UBreadcrumb",
            "UTabs",
            "UAccordion",
          ];

          uiComponents.forEach((componentName) => {
            const component = nuxtApp.vueApp.component(componentName);
            if (component) {
              g[componentName] = component;
              // Also make available on window for eval context
              window[componentName] = component;
            }
          });
        } catch (error) {
          console.warn("Failed to inject UI components:", error);
        }
      }

      // 2. Fetch plugin JS
      // Add cache busting to force reload updated plugins
      const cacheBustedUrl = `${url}?_t=${Date.now()}`;
      const response = await fetch(cacheBustedUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsCode = await response.text();

      // Validate response is JavaScript, not HTML
      if (jsCode.trim().startsWith("<")) {
        throw new Error(
          `Received HTML instead of JavaScript from ${url}. Check if plugin file exists and is compiled correctly.`
        );
      }

      // 3. Calculate component name from plugin ID
      const componentName = `Plugin_${pluginId.replace(/[^a-zA-Z0-9]/g, "_")}`;

      // 4. Clear existing component & create plugin context
      delete (window as any)[componentName];

      // Create and execute script element instead of eval for better security
      const script = document.createElement("script");
      script.textContent = jsCode;
      script.type = "text/javascript";

      // Execute script in controlled environment
      try {
        document.head.appendChild(script);
        // Remove script immediately after execution
        document.head.removeChild(script);
      } catch (scriptError) {
        document.head.removeChild(script);
        throw scriptError;
      }

      // 5. Get component
      const component = (window as any)[componentName];

      if (!component) {
        throw new Error(`${componentName} not found in global scope`);
      }

      // 6. Return with markRaw
      return markRaw(component);
    } catch (error: any) {
      throw new Error(`Failed to load component: ${error?.message || error}`);
    }
  };

  return {
    loadExternalComponent,
  };
};

// Type declarations
declare global {
  interface Window {
    [key: string]: any;
    Vue?: any;
    __NUXT_APP__?: any;
    __VUE_APP__?: any;
  }

  interface GlobalThis {
    useState?: any;
    useApi?: any;
    useAuth?: any;
    useToast?: any;
    useRouter?: any;
    useCookie?: any;
    useNuxtApp?: any;
    navigateTo?: any;
    useRoute?: any;
    useFetch?: any;
    useAsyncData?: any;
    useLazyFetch?: any;
    useHead?: any;
    useSeoMeta?: any;
    onMounted?: any;
    onUnmounted?: any;
    onBeforeMount?: any;
    onBeforeUnmount?: any;
    watch?: any;
    computed?: any;
    ref?: any;
    reactive?: any;
    resolveComponent?: any;
    resolveUIComponent?: any;
    // Nuxt UI components
    UIcon?: any;
    UButton?: any;
    UCard?: any;
    UBadge?: any;
    UInput?: any;
    UTextarea?: any;
    USelect?: any;
    UCheckbox?: any;
    URadio?: any;
    USwitch?: any;
    UModal?: any;
    UPopover?: any;
    UDropdown?: any;
    UTooltip?: any;
    UAlert?: any;
    UAvatar?: any;
    UProgress?: any;
    UTable?: any;
    UPagination?: any;
    UBreadcrumb?: any;
    UTabs?: any;
    UAccordion?: any;
  }
}
