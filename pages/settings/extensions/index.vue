<template>
  <div class="extension-manager-page">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-300">Extension Manager</h1>
    </div>

    <CommonLoadingState
      v-if="loading"
      title="Loading extensions..."
      description="Fetching extension registry"
      size="md"
      type="card"
      context="page"
    />

    <div
      v-else-if="extensions.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <UCard
        v-for="extension in extensions"
        :key="extension.id"
        class="relative group cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
        @click="navigateToDetail(extension)"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UAvatar
                :icon="getExtensionIcon(extension)"
                size="sm"
                color="primary"
                variant="soft"
              />
              <div>
                <div class="font-medium truncate">{{ extension.name }}</div>
              </div>
            </div>
            <PermissionGate
              :condition="{
                or: [{ route: '/extension_definition', actions: ['delete'] }],
              }"
            >
              <UButton
                icon="i-heroicons-trash"
                variant="outline"
                size="md"
                color="error"
                @click.stop="deleteExtension(extension)"
              />
            </PermissionGate>
          </div>
        </template>

        <div class="space-y-3">
          <!-- Description -->
          <div class="text-sm text-gray-300 line-clamp-2 leading-relaxed">
            {{ extension.description }}
          </div>

          <!-- Extension Info -->
          <div class="text-sm text-muted-foreground">
            <div class="flex items-center justify-between">
              <div>Type:</div>
              <UBadge variant="soft" color="primary">
                {{ getExtensionTypeLabel(extension.type) }}
              </UBadge>
            </div>
            <div
              class="flex items-center justify-between mt-1"
              v-if="extension.menu?.path"
            >
              <div>Route:</div>
              <NuxtLink
                v-if="extension.isEnabled"
                :to="extension.menu.path"
                class="text-xs font-mono text-primary-500 hover:text-primary-600 hover:underline transition-colors"
              >
                {{ extension.menu.path }}
              </NuxtLink>
              <span
                v-else
                class="text-xs font-mono text-gray-400 cursor-not-allowed"
                :title="'Extension is disabled. Enable extension to access this route.'"
              >
                {{ extension.menu.path }}
              </span>
            </div>
            <div class="flex items-center justify-between mt-1">
              <div>Status:</div>
              <div class="flex items-center gap-2">
                <UBadge
                  :color="extension.isEnabled ? 'success' : 'neutral'"
                  variant="soft"
                >
                  {{ extension.isEnabled ? "Active" : "Inactive" }}
                </UBadge>
                <PermissionGate
                  :condition="{
                    or: [
                      { route: '/extension_definition', actions: ['update'] },
                    ],
                  }"
                >
                  <UButton
                    :icon="
                      extension.isEnabled ? 'heroicons:pause' : 'heroicons:play'
                    "
                    variant="outline"
                    size="xs"
                    :color="extension.isEnabled ? 'warning' : 'success'"
                    @click.stop="toggleExtensionStatus(extension)"
                    :disabled="
                      getExtensionLoader(extension.id.toString()).isLoading
                    "
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
      v-else-if="!loading && extensions.length === 0"
      class="flex flex-col items-center justify-center py-12"
    >
      <UIcon
        name="i-heroicons-puzzle-piece"
        class="text-gray-400 mx-auto text-8xl mb-6"
      />
      <div class="text-center">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No extensions found
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          No extensions are currently registered in the system. Upload an
          extension to get started.
        </p>
      </div>
      <UButton
        icon="i-heroicons-arrow-up-tray"
        to="/settings/extensions/create"
        size="sm"
        variant="soft"
        color="primary"
      >
        Create Extension
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
// Interface for API response from /extension_definition
interface ExtensionDefinition {
  id: number;
  code: string;
  description: string | null;
  isEnabled: boolean;
  isSystem: boolean;
  name: string;
  type: string;
  version: string;
  menu?: {
    id: number;
    label: string;
    icon: string;
    path: string;
    sidebar: {
      id: number;
    };
  };
  createdBy?: {
    id: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const tableName = "extension_definition";
const { getIncludeFields } = useSchema(tableName);

const {
  data: apiData,
  pending: loading,
  execute: fetchExtensions,
} = useApiLazy(() => "/extension_definition", {
  query: computed(() => ({
    fields: getIncludeFields(),
    sort: "-createdAt",
    meta: "*",
  })),
  errorContext: "Fetch Extensions",
});

const extensions = computed<ExtensionDefinition[]>(
  () => apiData.value?.data || []
);

const { confirm } = useConfirm();
const toast = useToast();
const { createLoader } = useLoader();

// Register multiple header actions at once
useHeaderActionRegistry({
  id: "add-extension",
  label: "Create Extension",
  icon: "i-heroicons-plus",
  variant: "solid",
  color: "primary",
  size: "md",
  to: "/settings/extensions/create",
  permission: {
    and: [{ route: "/extension_definition", actions: ["create"] }],
  },
});

const getExtensionIcon = (extension: ExtensionDefinition) => {
  if (extension.type === "page") return "heroicons:document";
  if (extension.type === "widget") return "heroicons:cube";
  return "heroicons:puzzle-piece";
};

const navigateToDetail = (extension: ExtensionDefinition) => {
  navigateTo(`/settings/extensions/${extension.id}`);
};

const getExtensionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    page: "Page Extension",
    widget: "Widget Extension",
  };
  return labels[type] || type;
};

const { execute: updateExtension } = useApiLazy(() => "/extension_definition", {
  method: "patch",
  errorContext: "Update Extension",
});

// Create loaders for each extension toggle button
const extensionLoaders = ref<Record<string, any>>({});

function getExtensionLoader(extensionId: string) {
  if (!extensionLoaders.value[extensionId]) {
    extensionLoaders.value[extensionId] = createLoader();
  }
  return extensionLoaders.value[extensionId];
}

/**
 * Toggle extension active status
 */
const toggleExtensionStatus = async (extension: ExtensionDefinition) => {
  const loader = getExtensionLoader(extension.id.toString());
  const newStatus = !extension.isEnabled;

  // Optimistic update - change UI immediately
  // Update directly in apiData to trigger reactivity
  if (apiData.value?.data) {
    const extensionIndex = apiData.value.data.findIndex(
      (e: any) => e.id === extension.id
    );
    if (extensionIndex !== -1) {
      apiData.value.data[extensionIndex].isEnabled = newStatus;
    }
  }

  try {
    await loader.withLoading(() =>
      updateExtension({
        body: {
          isEnabled: newStatus,
        },
        id: extension.id,
      })
    );

    // Show toast notification
    toast.add({
      title: "Success",
      description: `Extension "${extension.name}" has been ${
        newStatus ? "activated" : "deactivated"
      } successfully!`,
      color: "success",
    });
  } catch (error) {
    // Revert optimistic update on error
    if (apiData.value?.data) {
      const extensionIndex = apiData.value.data.findIndex(
        (e: any) => e.id === extension.id
      );
      if (extensionIndex !== -1) {
        apiData.value.data[extensionIndex].isEnabled = !newStatus;
      }
    }

    toast.add({
      title: "Error",
      description: "Failed to update extension status",
      color: "error",
    });
  }
};

// API composable for deleting extension
const { execute: deleteExtensionApi } = useApiLazy(
  () => `/extension_definition`,
  {
    method: "delete",
    errorContext: "Delete Extension",
  }
);

const deleteExtension = async (extension: ExtensionDefinition) => {
  const isConfirmed = await confirm({
    title: "Delete Extension",
    content: `Are you sure you want to delete "${extension.description}"? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (isConfirmed) {
    await deleteExtensionApi({ id: extension.id });

    // Refetch extensions to update UI
    await fetchExtensions();

    // Show toast notification
    toast.add({
      title: "Success",
      description: `Extension "${extension.id}" has been deleted successfully!`,
      color: "success",
    });
  }
};

onMounted(async () => {
  await fetchExtensions();
});
</script>
