<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
        ></div>
        <p class="text-gray-600">Loading plugin...</p>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="flex items-center justify-center min-h-[400px]"
    >
      <div class="text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 class="text-xl font-semibold text-gray-800 mb-2">Plugin Error</h2>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button
          @click="retry"
          class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-600"
        >
          Retry
        </button>
      </div>
    </div>

    <!-- Plugin component -->
    <component
      v-else-if="pluginComponent"
      :is="pluginComponent"
      v-bind="pluginProps"
    />

    <!-- 404 state -->
    <div v-else class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="text-gray-400 text-6xl mb-4">🔌</div>
        <h2 class="text-xl font-semibold text-gray-800 mb-2">
          Plugin Not Found
        </h2>
        <p class="text-gray-600">No plugin found for route: {{ route.path }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { resolveComponent, reactive } from "vue";

// Get route params
const route = useRoute();
const sidebarParam = route.params.sidebar;
const pageParam = route.params.page;

// Resolve components in setup context (resolveComponent can only be used here)
// Only include components that definitely exist
const providedComponents = reactive({
  // Core Nuxt UI Components (confirmed to exist)
  UIcon: resolveComponent("UIcon"),
  UButton: resolveComponent("UButton"),
  UCard: resolveComponent("UCard"),
  UBadge: resolveComponent("UBadge"),
  UInput: resolveComponent("UInput"),
  UTextarea: resolveComponent("UTextarea"),
  USelect: resolveComponent("USelect"),
  UCheckbox: resolveComponent("UCheckbox"),
  UModal: resolveComponent("UModal"),
  UPopover: resolveComponent("UPopover"),
  UTooltip: resolveComponent("UTooltip"),
  UAlert: resolveComponent("UAlert"),
  UAvatar: resolveComponent("UAvatar"),
  UProgress: resolveComponent("UProgress"),
  UTable: resolveComponent("UTable"),
  UPagination: resolveComponent("UPagination"),
  UBreadcrumb: resolveComponent("UBreadcrumb"),
  UTabs: resolveComponent("UTabs"),
  UAccordion: resolveComponent("UAccordion"),

  // Custom Components
  PermissionGate: resolveComponent("PermissionGate"),
});

// Reactive state
const loading = ref(true);
const error = ref(null);
const pluginComponent = ref(null);
const pluginProps = ref({});
const matchedPlugin = ref(null);

// Plugin manager
const { getPlugins, loadPlugin } = usePluginManager();

/**
 * Find and load matching plugin
 */
const loadMatchingPlugin = async () => {
  loading.value = true;
  error.value = null;

  const plugins = await getPlugins();
  const pagePlugins = plugins.filter(
    (p) => p.type === "page" && p.registration && p.active
  );

  const sidebarRoute = `/${sidebarParam}`;
  const fullRoute = `/${sidebarParam}/${pageParam}`;

  const plugin = pagePlugins.find((p) => {
    const miniSidebarRoute = p.registration?.miniSidebar?.route;
    const menuItemRoute = p.registration?.menuItem?.route;

    return miniSidebarRoute === sidebarRoute && menuItemRoute === fullRoute;
  });

  if (!plugin) {
    error.value = `No plugin found for route: ${fullRoute}`;
    loading.value = false;
    return;
  }

  matchedPlugin.value = plugin;

  try {
    const component = await loadPlugin(plugin.id);
    pluginComponent.value = component;

    pluginProps.value = {
      pluginId: plugin.id,
      pluginDescription: plugin.description,
      sidebar: sidebarParam,
      page: pageParam,
      // UI Components
      ui: providedComponents,
      // Custom Components
      components: {
        PermissionGate: providedComponents.PermissionGate,
      },
    };
    loading.value = false;
  } catch (pluginError) {
    error.value = `Failed to load plugin: ${
      pluginError?.message || pluginError
    }`;
    loading.value = false;
  }
};

/**
 * Retry loading
 */
const retry = () => {
  loadMatchingPlugin();
};

// Load plugin on mount and when route changes
onMounted(() => {
  loadMatchingPlugin();
});

// Watch route changes
watch(
  () => route.params,
  () => {
    loadMatchingPlugin();
  },
  { deep: true }
);
</script>
