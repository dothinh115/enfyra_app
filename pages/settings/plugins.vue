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
            <UButton
              icon="i-heroicons-trash"
              variant="outline"
              size="md"
              color="error"
              @click="deletePlugin(plugin)"
            />
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
                :to="plugin.registration.menuItem.route"
                class="text-xs font-mono text-primary-500 hover:text-primary-600 hover:underline transition-colors"
              >
                {{ plugin.registration.menuItem.route }}
              </NuxtLink>
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
                <UButton
                  :icon="plugin.active ? 'heroicons:pause' : 'heroicons:play'"
                  variant="outline"
                  size="xs"
                  :color="plugin.active ? 'warning' : 'success'"
                  @click="togglePluginStatus(plugin)"
                >
                </UButton>
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

useHeaderActionRegistry({
  id: "add-plugin",
  icon: "i-heroicons-plus",
  variant: "solid",
  color: "primary",
  size: "lg",
  class: "rounded-full",
  onClick: () => {
    showUploadModal.value = true;
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

  // Show success toast and reload page after 3 seconds
  toast.add({
    title: "Plugin Status Updated",
    description: "Page will reload in 3 seconds to apply changes.",
    color: "success",
  });

  // Reload page after 3 seconds
  setTimeout(() => {
    window.location.reload();
  }, 3000);
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

    // Show success toast and reload page after 3 seconds
    toast.add({
      title: "Plugin Deleted Successfully",
      description: "Page will reload in 3 seconds to apply changes.",
      color: "success",
    });

    // Reload page after 3 seconds
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }
};

const handlePluginUpload = async (files: File | File[]) => {
  const file = Array.isArray(files) ? files[0] : files;

  const formData = new FormData();
  formData.append("file", file);

  await uploadPluginApi({
    body: formData,
  });

  // Close modal after successful upload
  showUploadModal.value = false;

  // Show success toast and reload page after 3 seconds
  toast.add({
    title: "Plugin Installed Successfully",
    description: "Page will reload in 3 seconds to apply changes.",
    color: "success",
  });

  // Reload page after 3 seconds
  setTimeout(() => {
    window.location.reload();
  }, 3000);
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
