<template>
  <div class="extension-manager-page">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-300">Extension Manager</h1>
    </div>

    <Transition name="loading-fade" mode="out-in">
      <CommonLoadingState
        v-if="!isMounted || loading"
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
                    <USwitch
                      :model-value="extension.isEnabled"
                      @update:model-value="toggleExtensionStatus(extension)"
                      :disabled="
                        getExtensionLoader(extension.id.toString()).isLoading
                      "
                    />
                  </PermissionGate>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <CommonEmptyState
        v-else
        title="No extensions found"
        description="No extensions have been created yet"
        icon="lucide:puzzle"
        size="lg"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
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

const toast = useToast();
const { confirm } = useConfirm();
const { createLoader } = useLoader();

const { isMounted } = useMounted();

const {
  data: apiData,
  pending: loading,
  execute: fetchExtensions,
} = useApiLazy(() => "/extension_definition", {
  query: {
    fields: ["*", "menu.*"].join(","),
    limit: 0,
    sort: ["id"].join(","),
  },
  errorContext: "Fetch Extensions",
});

const extensions = computed(() => apiData.value?.data || []);

const extensionLoaders = ref<Record<string, any>>({});

const { execute: updateExtension } = useApiLazy(() => `/extension_definition`, {
  method: "patch",
  errorContext: "Update Extension",
});

useHeaderActionRegistry([
  {
    id: "create-extension",
    label: "Create Extension",
    icon: "lucide:plus",
    variant: "solid",
    color: "primary",
    size: "md",
    to: "/settings/extensions/create",
    permission: {
      and: [
        {
          route: "/extension_definition",
          actions: ["create"],
        },
      ],
    },
  },
]);

function getExtensionIcon(extension: ExtensionDefinition) {
  switch (extension.type) {
    case "page":
      return "i-lucide-file-text";
    case "component":
      return "i-lucide-puzzle-piece";
    case "widget":
      return "i-lucide-layout-dashboard";
    default:
      return "i-lucide-puzzle";
  }
}

function getExtensionTypeLabel(type: string) {
  switch (type) {
    case "page":
      return "Page";
    case "component":
      return "Component";
    case "widget":
      return "Widget";
    default:
      return "Unknown";
  }
}

function navigateToDetail(extension: ExtensionDefinition) {
  navigateTo(`/settings/extensions/${extension.id}`);
}

function getExtensionLoader(extensionId: string) {
  if (!extensionLoaders.value[extensionId]) {
    extensionLoaders.value[extensionId] = createLoader();
  }
  return extensionLoaders.value[extensionId];
}

const toggleExtensionStatus = async (extension: ExtensionDefinition) => {
  const loader = getExtensionLoader(extension.id.toString());
  const newStatus = !extension.isEnabled;

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

    toast.add({
      title: "Success",
      description: `Extension "${extension.name}" has been ${
        newStatus ? "activated" : "deactivated"
      } successfully!`,
      color: "success",
    });
  } catch (error) {
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

    await fetchExtensions();

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
