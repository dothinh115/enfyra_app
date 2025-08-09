<template>
  <div>
    <!-- Loading state -->
    <CommonLoadingState
      v-if="loading"
      title="Loading plugin..."
      description="Fetching plugin component"
      size="md"
      type="dots"
      context="page"
    />

    <!-- Error state -->
    <CommonEmptyState
      v-else-if="error"
      :title="error.includes('disabled') ? 'Plugin Disabled' : 'Plugin Error'"
      :description="error"
      :icon="
        error.includes('disabled')
          ? 'i-heroicons-lock-closed'
          : 'i-heroicons-exclamation-triangle'
      "
      size="md"
      :action="
        error.includes('disabled')
          ? {
              label: 'Go to Plugin Settings',
              onClick: () => {
                $router.push('/settings/plugins');
              },
              icon: 'i-heroicons-cog-6-tooth',
            }
          : {
              label: 'Retry',
              onClick: retry,
              icon: 'i-heroicons-arrow-path',
            }
      "
    />

    <!-- Plugin component -->
    <component
      v-else-if="pluginComponent"
      :is="pluginComponent"
      v-bind="pluginProps"
    />

    <!-- 404 state -->
    <CommonEmptyState
      v-else
      title="Plugin Not Found"
      :description="`No plugin found for route: ${route.path}`"
      icon="i-heroicons-puzzle-piece"
      size="md"
      :action="{
        label: 'Browse Plugins',
        onClick: () => {
          $router.push('/settings/plugins');
        },
        icon: 'i-heroicons-cog-6-tooth',
      }"
    />
  </div>
</template>

<script setup>
import { resolveComponent, markRaw } from "vue";

// Get route params
const route = useRoute();
const sidebarParam = route.params.sidebar;
const pageParam = route.params.page;

// Resolve components in setup context (resolveComponent can only be used here)
// Only include components that definitely exist
const providedComponents = {
  // Core Nuxt UI Components (confirmed to exist)
  UIcon: markRaw(resolveComponent("UIcon")),
  UButton: markRaw(resolveComponent("UButton")),
  UCard: markRaw(resolveComponent("UCard")),
  UBadge: markRaw(resolveComponent("UBadge")),
  UInput: markRaw(resolveComponent("UInput")),
  UTextarea: markRaw(resolveComponent("UTextarea")),
  USelect: markRaw(resolveComponent("USelect")),
  UCheckbox: markRaw(resolveComponent("UCheckbox")),
  UModal: markRaw(resolveComponent("UModal")),
  UPopover: markRaw(resolveComponent("UPopover")),
  UTooltip: markRaw(resolveComponent("UTooltip")),
  UAlert: markRaw(resolveComponent("UAlert")),
  UAvatar: markRaw(resolveComponent("UAvatar")),
  UProgress: markRaw(resolveComponent("UProgress")),
  UTable: markRaw(resolveComponent("UTable")),
  UPagination: markRaw(resolveComponent("UPagination")),
  UBreadcrumb: markRaw(resolveComponent("UBreadcrumb")),
  UTabs: markRaw(resolveComponent("UTabs")),
  UAccordion: markRaw(resolveComponent("UAccordion")),

  // Custom Components
  PermissionGate: markRaw(resolveComponent("PermissionGate")),
};

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
  const allPagePlugins = plugins.filter(
    (p) => p.type === "page" && p.registration
  );

  const sidebarRoute = `/${sidebarParam}`;
  const fullRoute = `/${sidebarParam}/${pageParam}`;

  // First check if plugin exists (regardless of active status)
  const existingPlugin = allPagePlugins.find((p) => {
    const menuItemRoute = p.registration?.menuItem?.route;

    // Check if menuItem route matches the full route
    return menuItemRoute === fullRoute;
  });

  if (!existingPlugin) {
    error.value = `No plugin found for route: ${fullRoute}`;
    loading.value = false;
    return;
  }

  // Check if plugin is disabled
  if (!existingPlugin.active) {
    error.value = `Plugin "${existingPlugin.id}" is currently disabled. Please contact an administrator to enable this plugin.`;
    loading.value = false;
    return;
  }

  const plugin = existingPlugin;

  matchedPlugin.value = plugin;

  try {
    const component = await loadPlugin(plugin.id);
    pluginComponent.value = component;

    pluginProps.value = {
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
