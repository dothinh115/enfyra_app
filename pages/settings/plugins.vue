<template>
  <div class="plugin-manager-page">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-300">Plugin Manager</h1>
    </div>

    <CommonLoadingState
      v-if="loading"
      title="Loading plugins..."
      description="Fetching plugin registry"
      size="sm"
      type="card"
      context="page"
    />

    <div
      v-else-if="plugins.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <UCard v-for="plugin in plugins" :key="plugin.id" class="relative group">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UAvatar
                :icon="getPluginIcon(plugin)"
                size="sm"
                color="primary"
                variant="soft"
              />
              <div>
                <div class="font-medium truncate">{{ plugin.id }}</div>
              </div>
            </div>
            <PermissionGate
              :condition="{
                or: [{ route: '/plugin_registry', actions: ['delete'] }],
              }"
            >
              <UButton
                icon="i-heroicons-trash"
                variant="outline"
                size="md"
                color="error"
                @click="deletePlugin(plugin)"
              />
            </PermissionGate>
          </div>
        </template>

        <div class="space-y-3">
          <!-- Description -->
          <div class="text-sm text-gray-300 line-clamp-2 leading-relaxed">
            {{ plugin.description }}
          </div>

          <!-- Plugin Info -->
          <div class="text-sm text-muted-foreground">
            <div class="flex items-center justify-between">
              <div>Type:</div>
              <UBadge variant="soft" color="primary">
                {{ getPluginTypeLabel(plugin.type) }}
              </UBadge>
            </div>
            <div
              class="flex items-center justify-between mt-1"
              v-if="plugin.registration?.menuItem?.route"
            >
              <div>Route:</div>
              <NuxtLink
                v-if="plugin.active"
                :to="plugin.registration.menuItem.route"
                class="text-xs font-mono text-primary-500 hover:text-primary-600 hover:underline transition-colors"
              >
                {{ plugin.registration.menuItem.route }}
              </NuxtLink>
              <span
                v-else
                class="text-xs font-mono text-gray-400 cursor-not-allowed"
                :title="'Plugin is disabled. Enable plugin to access this route.'"
              >
                {{ plugin.registration.menuItem.route }}
              </span>
            </div>
            <div class="flex items-center justify-between mt-1">
              <div>Status:</div>
              <div class="flex items-center gap-2">
                <UBadge
                  :color="plugin.active ? 'success' : 'neutral'"
                  variant="soft"
                >
                  {{ plugin.active ? "Active" : "Inactive" }}
                </UBadge>
                <PermissionGate
                  :condition="{
                    or: [{ route: '/plugin_registry', actions: ['update'] }],
                  }"
                >
                  <UButton
                    :icon="plugin.active ? 'heroicons:pause' : 'heroicons:play'"
                    variant="outline"
                    size="xs"
                    :color="plugin.active ? 'warning' : 'success'"
                    @click="togglePluginStatus(plugin)"
                  >
                  </UButton>
                </PermissionGate>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!loading && plugins.length === 0"
      class="flex flex-col items-center justify-center py-12"
    >
      <UIcon
        name="i-heroicons-puzzle-piece"
        class="text-gray-400 mx-auto text-8xl mb-6"
      />
      <div class="text-center">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No plugins found
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          No plugins are currently registered in the system. Upload a plugin to
          get started.
        </p>
      </div>
    </div>

    <!-- Upload Modal -->
    <CommonUploadModal
      v-model="showUploadModal"
      title="Upload Plugin"
      :accept="['.zip']"
      :multiple="false"
      :max-size="50 * 1024 * 1024"
      :loading="uploadPending"
      drag-text="Drag and drop your plugin ZIP file here"
      upload-text="Upload Plugin"
      @upload="handlePluginUpload"
      @error="handleUploadError"
    />
  </div>
</template>

<script setup lang="ts">
import type { Plugin } from "~/composables/usePluginManager";

definePageMeta({
  layout: "default",
  title: "Plugin Manager",
});

const showUploadModal = ref(false);

const {
  data: apiData,
  pending: loading,
  execute: fetchPlugins,
} = useApiLazy(() => "/plugin/registry", {
  errorContext: "Fetch Plugins",
});

const plugins = computed(() => apiData.value?.plugins || []);

const { confirm } = useConfirm();
const toast = useToast();
const { reregisterPluginMenus } = useMenuRegistry();

// Register multiple header actions at once
useHeaderActionRegistry({
  id: "add-plugin",
  icon: "i-heroicons-plus",
  variant: "solid",
  color: "primary",
  class: "rounded-full",
  size: "lg",
  onClick: () => {
    showUploadModal.value = true;
  },
  permission: {
    or: [{ route: "/plugin_registry", actions: ["create"] }],
  },
});

const getPluginIcon = (plugin: Plugin) => {
  if (plugin.type === "page") return "heroicons:document";
  if (plugin.type === "widget") return "heroicons:cube";
  return "heroicons:puzzle-piece";
};

const getPluginTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    page: "Page Plugin",
    widget: "Widget Plugin",
  };
  return labels[type] || type;
};
const { execute: updatePlugin } = useApiLazy(() => "/plugin/registry", {
  method: "patch",
  errorContext: "Update Plugin",
});

// API composable for uploading plugin
const { execute: uploadPluginApi, pending: uploadPending } = useApiLazy(
  () => "/api/plugin/registry",
  {
    method: "post",
    errorContext: "Upload Plugin",
  }
);

/**
 * Toggle plugin active status
 */
const togglePluginStatus = async (plugin: Plugin) => {
  const newStatus = !plugin.active;

  await updatePlugin({
    body: {
      pluginId: plugin.id,
      updates: { active: newStatus },
    },
  });

  // Refetch plugins to update UI
  await fetchPlugins();

  // Hot reload plugin menus
  await reregisterPluginMenus();

  // Show toast notification
  toast.add({
    title: "Success",
    description: `Plugin "${plugin.id}" has been ${
      newStatus ? "activated" : "deactivated"
    } successfully!`,
    color: "success",
  });
};

// API composable for deleting plugin
const { execute: deletePluginApi } = useApiLazy(() => "/plugin/registry", {
  method: "delete",
  errorContext: "Delete Plugin",
});

const deletePlugin = async (plugin: Plugin) => {
  const isConfirmed = await confirm({
    title: "Delete Plugin",
    content: `Are you sure you want to delete "${plugin.description}"? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (isConfirmed) {
    await deletePluginApi({
      body: { pluginId: plugin.id },
    });

    // Refetch plugins to update UI
    await fetchPlugins();

    // Hot reload plugin menus to remove deleted plugin
    await reregisterPluginMenus();

    // Show toast notification
    toast.add({
      title: "Success",
      description: `Plugin "${plugin.id}" has been deleted successfully!`,
      color: "success",
    });
  }
};

const handlePluginUpload = async (files: File | File[]) => {
  const file = Array.isArray(files) ? files[0] : files;

  const formData = new FormData();
  formData.append("file", file);

  await uploadPluginApi({
    body: formData,
  });

  // Refetch plugins to update UI
  await fetchPlugins();

  // Hot reload plugin menus to include new plugin
  await reregisterPluginMenus();

  // Close upload modal
  showUploadModal.value = false;

  // Show toast notification
  toast.add({
    title: "Success",
    description: "Plugin has been uploaded successfully!",
    color: "success",
  });
};

const handleUploadError = (message: string) => {
  toast.add({
    title: "Upload Error",
    description: message,
    color: "error",
  });
};

onMounted(async () => {
  await fetchPlugins();
});
</script>
