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
              onClick: () => {
                $router.push('/settings/extensions');
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
        onClick: () => {
          $router.push('/settings/extensions');
        },
        icon: 'i-heroicons-cog-6-tooth',
      }"
    />
  </div>
</template>

<script setup lang="ts">
// Imports
import { useDynamicComponent } from "~/composables/useDynamicComponent";
import { useMenuApi } from "~/composables/useMenuApi";
import { useApiLazy } from "~/composables/useApi";

// Get route params
const route = useRoute();
const sidebarParam = route.params.sidebar;
const pageParam = route.params.page;

// Use the new dynamic component composable
const { loadDynamicComponent } = useDynamicComponent();

// Reactive state
const loading = ref(true);
const error = ref<string | null>(null);
const extensionComponent = ref<any>(null);
const matchedExtension = ref<Record<string, any> | null>(null);

// Menu API để lấy menu data
const { fetchMenuDefinitions, getMenuItems } = useMenuApi();

// Reactive extension ID (có thể là number hoặc string)
const extensionId = ref<number | string | null>(null);

// Setup useApiLazy composable ở top level
const {
  data: extensionResponse,
  error: extensionError,
  execute: executeFetchExtension,
} = useApiLazy(() => "/extension_definition", {
  query: computed(() => {
    // Tìm extension theo route path thay vì menu ID
    const query: any = {
      fields: "*,menu.*,createdBy.*,updatedBy.*",
      "filter[id][_eq]": extensionId.value,
    };

    return query;
  }),
  errorContext: "Fetch Extension Definition",
});

/**
 * Find and load matching extension
 */
const loadMatchingExtension = async () => {
  loading.value = true;
  error.value = null;

  try {
    // 1. Fetch menu definitions để tìm menu match với route
    await fetchMenuDefinitions();
    const menuDefinitions = getMenuItems.value || [];
    const fullRoute = `/${sidebarParam}/${pageParam}`;

    // 2. Tìm menu item match với route hiện tại
    const matchingMenuItem = menuDefinitions.find((menu: any) => {
      const isMatch = menu.path === fullRoute && menu.isEnabled;
      return isMatch;
    });

    if (!matchingMenuItem) {
      error.value = `No menu found for route: ${fullRoute}`;
      loading.value = false;
      return;
    }
    if (!matchingMenuItem.extension) {
      error.value = `No extension found for route: ${fullRoute}`;
      loading.value = false;
      return;
    }
    extensionId.value = matchingMenuItem.extension.id;
    await executeFetchExtension();

    if (extensionError.value) {
      error.value = `API Error: ${extensionError.value}`;
      loading.value = false;
      return;
    }

    if (
      !extensionResponse.value?.data ||
      extensionResponse.value.data.length === 0
    ) {
      error.value = `No page extensions found`;
      loading.value = false;
      return;
    }

    // Nếu có nhiều extensions, chọn extension đầu tiên
    // Trong tương lai có thể cải thiện logic này
    const extensions = extensionResponse.value.data;
    const extension = extensions[0]; // Chọn extension đầu tiên

    // 4. Kiểm tra extension có enabled không
    if (!extension.isEnabled) {
      error.value = `Extension "${extension.name}" is currently disabled. Please contact an administrator to enable this extension.`;
      loading.value = false;
      return;
    }

    // 5. Load extension using the new composable
    const component = await loadDynamicComponent(extension.code, extension.id);

    extensionComponent.value = component;
    loading.value = false;
  } catch (err: any) {
    error.value = `Failed to load extension: ${err?.message || err}`;
    loading.value = false;
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
