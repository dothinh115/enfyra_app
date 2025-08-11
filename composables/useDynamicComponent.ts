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
  PermissionGate,
  FormEditor,
  CommonUploadModal,
} from "#components";

// Import Enfyra components

// Import Enfyra composables
import { useApi, useApiLazy } from "~/composables/useApi";
import { useHeaderActionRegistry } from "~/composables/useHeaderActionRegistry";
import { useSchema } from "~/composables/useSchema";
import { useScreen } from "~/composables/useScreen";
import { useGlobalState } from "~/composables/useGlobalState";
import { useConfirm } from "~/composables/useConfirm";
import { useAuth } from "~/composables/useAuth";
import { usePermissions } from "~/composables/usePermissions";

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

    // Common Components
    CommonLoadingState: markRaw(CommonLoadingState),
    CommonEmptyState: markRaw(CommonEmptyState),
    CommonUploadModal: markRaw(CommonUploadModal),
  };

  /**
   * Load component from compiled code string
   * @param code - Compiled JavaScript code string
   * @param extensionName - Tên extension để tìm component (mặc định: "Extension")
   * @returns Promise that resolves to Vue component with injected dependencies
   */
  const loadDynamicComponent = async (
    code: string,
    extensionName: string = "Extension"
  ) => {
    try {
      console.log(`Loading dynamic component for extension: ${extensionName}`);
      console.log(`Code length: ${code.length}`);
      console.log(`Code preview:`, code.substring(0, 200) + "...");

      // 1. Setup globals if not already done
      if (!(window as any).Vue) {
        (window as any).Vue = await import("vue");
      }

      // Inject composables globally
      const g = globalThis as any;

      // Core Enfyra composables
      g.useApi = useApi;
      g.useApiLazy = useApiLazy;
      g.useHeaderActionRegistry = useHeaderActionRegistry;
      g.useSchema = useSchema;
      g.useScreen = useScreen;
      g.useGlobalState = useGlobalState;
      g.useConfirm = useConfirm;
      g.useAuth = useAuth;
      g.usePermissions = usePermissions;

      // Nuxt composables
      g.useToast = useToast;
      g.useState = useState;
      g.useRoute = useRoute;
      g.useRouter = useRouter;
      g.useCookie = useCookie;
      g.useNuxtApp = useNuxtApp;
      g.navigateTo = navigateTo;
      g.useFetch = useFetch;
      g.useAsyncData = useAsyncData;
      g.useLazyFetch = useLazyFetch;
      g.useHead = useHead;
      g.useSeoMeta = useSeoMeta;

      // Vue functions
      const {
        ref,
        reactive,
        computed,
        watch,
        watchEffect,
        onMounted,
        onUnmounted,
        onBeforeMount,
        onBeforeUnmount,
        onUpdated,
        onBeforeUpdate,
        nextTick,
        resolveComponent,
        h,
        defineComponent,
        defineProps,
        defineEmits,
        defineExpose,
        toRef,
        toRefs,
        unref,
        isRef,
        shallowRef,
        triggerRef,
        customRef,
        shallowReactive,
        readonly,
        shallowReadonly,
        isProxy,
        isReactive,
        isReadonly,
        toRaw,
        markRaw,
        effectScope,
        getCurrentScope,
        onScopeDispose,
      } = await import("vue");

      g.ref = ref;
      g.reactive = reactive;
      g.computed = computed;
      g.watch = watch;
      g.watchEffect = watchEffect;
      g.onMounted = onMounted;
      g.onUnmounted = onUnmounted;
      g.onBeforeMount = onBeforeMount;
      g.onBeforeUnmount = onBeforeUnmount;
      g.onUpdated = onUpdated;
      g.onBeforeUpdate = onBeforeUpdate;
      g.nextTick = nextTick;
      g.resolveComponent = resolveComponent;
      g.h = h;
      g.defineComponent = defineComponent;
      g.defineProps = defineProps;
      g.defineEmits = defineEmits;
      g.defineExpose = defineExpose;
      g.toRef = toRef;
      g.toRefs = toRefs;
      g.unref = unref;
      g.isRef = isRef;
      g.shallowRef = shallowRef;
      g.triggerRef = triggerRef;
      g.customRef = customRef;
      g.shallowReactive = shallowReactive;
      g.readonly = readonly;
      g.shallowReadonly = shallowReadonly;
      g.isProxy = isProxy;
      g.isReactive = isReactive;
      g.isReadonly = isReadonly;
      g.toRaw = toRaw;
      g.markRaw = markRaw;
      g.effectScope = effectScope;
      g.getCurrentScope = getCurrentScope;
      g.onScopeDispose = onScopeDispose;

      // 2. Execute the code
      // Sử dụng tên extension được truyền vào để tìm component
      const componentName = extensionName;

      console.log("Expected component name:", componentName);

      // Clear any existing component with same name
      delete (window as any)[componentName];

      // Create and execute script
      const script = document.createElement("script");
      script.textContent = code;
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
