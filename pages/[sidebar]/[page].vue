<template>
  <div>
    <!-- Loading state -->
    <CommonLoadingState
      v-if="loading"
      title="Loading extension..."
      description="Fetching extension component"
      size="md"
      type="dots"
      context="page"
    />

    <!-- Error state -->
    <CommonEmptyState
      v-else-if="error"
      :title="
        error.includes('disabled') ? 'Extension Disabled' : 'Extension Error'
      "
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
              label: 'Go to Extension Settings',
              onClick: async () => {
                await navigateTo('/settings/extensions');
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

    <!-- Extension component -->
    <component
      v-else-if="extensionComponent"
      :is="extensionComponent"
      :components="extensionComponent.components"
    />

    <!-- 404 state -->
    <CommonEmptyState
      v-else
      title="Extension Not Found"
      :description="`No extension found for route: ${route.path}`"
      icon="i-heroicons-puzzle-piece"
      size="md"
      :action="{
        label: 'Browse Extensions',
        onClick: async () => {
          await navigateTo('/settings/extensions');
        },
        icon: 'i-heroicons-cog-6-tooth',
      }"
    />
  </div>
</template>

<script setup lang="ts">
// Imports
import { useDynamicComponent } from "~/composables/useDynamicComponent";
import { useApiLazy } from "~/composables/useApi";

// Get route params
const route = useRoute();
const sidebarParam = route.params.sidebar;
const pageParam = route.params.page;

// Use the new dynamic component composable
const { loadDynamicComponent } = useDynamicComponent();

// Reactive state
const error = ref<string | null>(null);
const extensionComponent = ref<any>(null);
const matchedExtension = ref<Record<string, any> | null>(null);

// Setup useApiLazy composable để fetch menu với extension trong một request
const {
  data: menuResponse,
  error: menuError,
  pending: loading,
  execute: executeFetchMenu,
} = useApiLazy(() => "/menu_definition", {
  query: computed(() => {
    const fullRoute = `/${sidebarParam}/${pageParam}`;
    return {
      fields: "*,extension.*",
      filter: {
        _and: [{ path: { _eq: fullRoute } }, { isEnabled: { _eq: true } }],
      },
    };
  }),
  errorContext: "Fetch Menu with Extension",
});

/**
 * Find and load matching extension
 */
const loadMatchingExtension = async () => {
  error.value = null;

  try {
    // 1. Fetch menu với extension trong một request
    await executeFetchMenu();

    if (menuError.value) {
      error.value = `API Error: ${menuError.value}`;
      return;
    }

    if (!menuResponse.value?.data || menuResponse.value.data.length === 0) {
      error.value = `No menu found for route: /${sidebarParam}/${pageParam}`;
      return;
    }

    // 2. Lấy menu item đầu tiên (vì đã filter theo path và isEnabled)
    const menuItem = menuResponse.value.data[0];

    if (!menuItem.extension || menuItem.extension.length === 0) {
      error.value = `No extension found for route: /${sidebarParam}/${pageParam}`;
      return;
    }

    const extension = menuItem.extension;

    if (!extension.isEnabled) {
      error.value = `Extension "${extension.name}" is currently disabled. Please contact an administrator to enable this extension.`;
      return;
    }

    const component = await loadDynamicComponent(
      extension.code,
      extension.extensionId
    );

    extensionComponent.value = component;
  } catch (err: any) {
    error.value = `Failed to load extension: ${err?.message || err}`;
  }
};

/**
 * Retry loading
 */
const retry = () => {
  loadMatchingExtension();
};

// Load extension on mount and when route changes
onMounted(() => {
  loadMatchingExtension();
});

// Watch route changes
watch(
  () => route.params,
  () => {
    loadMatchingExtension();
  },
  { deep: true }
);
</script>
