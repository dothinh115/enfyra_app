<script setup lang="ts">
const route = useRoute();
const currentPath = ref((route.query.path as string) || "");

// API call for root level folders (parent = null)
const {
  data: folders,
  pending,
  execute: refreshFolders,
} = useApiLazy(() => "folder_definition", {
  query: computed(() => ({
    limit: 100,
    fields: "*",
    sort: "order,name",
    filter: {
      parent: { _null: true },
    },
  })),
});

// Breadcrumb navigation
const pathSegments = computed(() => {
  if (!currentPath.value) return [];
  return currentPath.value.split("/").filter(Boolean);
});

const toast = useToast();
const { confirm } = useConfirm();
const showDetailModal = ref(false);
const selectedFolder = ref<any>(null);

// Multi-select state
const selectedFolders = ref<string[]>([]);
const isSelectionMode = ref(false);

// Context menu - no separate state needed

// Multi-select functions
function toggleFolderSelection(folderId: string) {
  const index = selectedFolders.value.indexOf(folderId);
  if (index > -1) {
    selectedFolders.value.splice(index, 1);
  } else {
    selectedFolders.value.push(folderId);
  }
}

function toggleSelectionMode() {
  isSelectionMode.value = !isSelectionMode.value;
  
  if (!isSelectionMode.value) {
    selectedFolders.value = [];
  }
}

function toggleSelectAll() {
  if (selectedFolders.value.length === folders.value?.data?.length) {
    // All selected, deselect all
    selectedFolders.value = [];
  } else {
    // Not all selected, select all
    selectedFolders.value = [];
    folders.value?.data?.forEach((folder: any) => {
      selectedFolders.value.push(folder.id);
    });
  }
}


// Register header action for create folder
useHeaderActionRegistry([
  {
    id: "create-folder",
    label: "New Folder", 
    icon: "lucide:folder-plus",
    onClick: () => {
      navigateTo("/files/folders/create");
    },
    side: "right",
  },
]);

// Computed actions for better performance
const deleteAction = computed(() => ({
  id: "delete-selected",
  label: `Delete (${selectedFolders.value.length})`,
  icon: "lucide:trash",
  color: "error" as const,
  onClick: () => deleteSelectedFolders(),
  side: "right" as const,
  show: isSelectionMode.value && selectedFolders.value.length > 0,
}));

const selectAllAction = computed(() => ({
  id: "select-all", 
  label: selectedFolders.value.length === folders.value?.data?.length ? "Deselect All" : "Select All",
  icon: selectedFolders.value.length === folders.value?.data?.length ? "lucide:square" : "lucide:check-square-2",
  onClick: toggleSelectAll,
  side: "right" as const,
  show: isSelectionMode.value,
}));

const selectModeAction = computed(() => ({
  id: "select-mode",
  label: isSelectionMode.value ? "Cancel" : "Select", 
  icon: isSelectionMode.value ? "lucide:x" : "lucide:check-square",
  color: "neutral" as const,
  variant: isSelectionMode.value ? "solid" : "soft",
  onClick: toggleSelectionMode,
  side: "right" as const,
}));

// Watch and re-register when values change
watch([deleteAction, selectAllAction, selectModeAction], () => {
  useSubHeaderActionRegistry([
    deleteAction.value,
    selectAllAction.value, 
    selectModeAction.value,
  ]);
}, { immediate: true });

onMounted(() => {
  refreshFolders();
});

function handleFolderDoubleClick(folder: any) {
  navigateTo(`/files/folders?path=${folder.path}`);
}

function showFolderDetail(folder: any) {
  selectedFolder.value = folder;
  showDetailModal.value = true;
}


function getContextMenuItems(folder: any) {
  return [
    [
      {
        label: "Open",
        icon: "i-lucide-folder-open",
        onSelect: () => handleFolderDoubleClick(folder),
      },
      {
        label: "Details",
        icon: "i-lucide-info",
        onSelect: () => showFolderDetail(folder),
      },
    ],
    [
      {
        label: "Delete",
        icon: "i-lucide-trash",
        color: "error" as const,
        onSelect: () => deleteFolder(folder),
      },
    ],
  ];
}

async function deleteFolder(folder: any) {
  const isConfirmed = await confirm({
    title: "Delete Folder",
    content: `Are you sure you want to delete folder "${folder.name}"? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (isConfirmed) {
    const { execute: deleteFolderApi, error: deleteError } = useApiLazy(
      () => `folder_definition/${folder.id}`,
      {
        method: "delete",
        errorContext: "Delete Folder",
      }
    );

    await deleteFolderApi();

    if (deleteError.value) {
      return;
    }

    await refreshFolders();

    toast.add({
      title: "Success",
      description: `Folder "${folder.name}" has been deleted successfully!`,
      color: "success",
    });
  }
}

async function deleteSelectedFolders() {
  if (selectedFolders.value.length === 0) return;

  const folderNames = selectedFolders.value
    .map(id => folders.value?.data?.find((f: any) => f.id === id)?.name)
    .filter(Boolean);

  const isConfirmed = await confirm({
    title: "Delete Multiple Folders",
    content: `Are you sure you want to delete ${selectedFolders.value.length} folder(s)? This includes: ${folderNames.slice(0, 3).join(', ')}${folderNames.length > 3 ? ` and ${folderNames.length - 3} more` : ''}. This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (isConfirmed) {
    const deletePromises = selectedFolders.value.map(async (folderId) => {
      const { execute: deleteFolderApi } = useApiLazy(
        () => `folder_definition/${folderId}`,
        {
          method: "delete",
          errorContext: "Delete Folder",
        }
      );
      await deleteFolderApi();
    });

    try {
      await Promise.all(deletePromises);
      await refreshFolders();
      
      toast.add({
        title: "Success",
        description: `${selectedFolders.value.length} folder(s) deleted successfully!`,
        color: "success",
      });
      
      selectedFolders.value = [];
      isSelectionMode.value = false;
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Some folders could not be deleted. Please try again.",
        color: "error",
      });
    }
  }
}

// navigateUp function removed since breadcrumbs handled by layout
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="!mb-20">
      <h1 class="text-2xl font-bold text-gray-300">Folder Manager</h1>
    </div>

    <!-- Content -->
    <Transition name="loading-fade" mode="out-in">
      <CommonLoadingState
        v-if="pending"
        title="Loading folders..."
        description="Fetching folder structure"
        size="sm"
        type="card"
        context="page"
      />

      <div
        v-else-if="folders?.data?.length > 0"
        class="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8"
      >
        <UContextMenu
          v-for="folder in folders?.data"
          :key="folder.id"
          :items="getContextMenuItems(folder)"
        >
          <div
            class="group flex flex-col items-center cursor-pointer relative p-2"
            :class="{ 'bg-primary/10 rounded-lg': selectedFolders.includes(folder.id) }"
            @dblclick="!isSelectionMode && handleFolderDoubleClick(folder)"
            @click="() => {
              if (isSelectionMode) {
                toggleFolderSelection(folder.id);
              } else {
                handleFolderDoubleClick(folder);
              }
            }"
          >
            <!-- Selection Checkbox -->
            <div 
              v-if="isSelectionMode" 
              class="absolute -top-3 -right-3 z-10"
              @click.stop
            >
              <UCheckbox
                :model-value="selectedFolders.includes(folder.id)"
                @update:model-value="() => toggleFolderSelection(folder.id)"
                size="lg"
                color="primary"
              />
            </div>

            <!-- Folder Icon - Main Element -->
            <div class="relative">
              <UIcon
                :name="folder.icon || 'i-lucide-folder'"
                :size="120"
                class="text-sky-500 group-hover:text-sky-600 transition-colors"
                style="color: #5aaadb"
                :class="{ 'opacity-70': isSelectionMode && !selectedFolders.includes(folder.id) }"
              />
            </div>

            <!-- Folder Name Below -->
            <div class="text-center w-full mt-2">
              <p
                class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-sky-600 transition-colors"
                :class="{ 'opacity-70': isSelectionMode && !selectedFolders.includes(folder.id) }"
              >
                {{ folder.name }}
              </p>
            </div>
          </div>
        </UContextMenu>
      </div>

      <CommonEmptyState
        v-else
        title="No folders found"
        description="Create your first folder to get started organizing your files"
        icon="lucide:folder-x"
        size="sm"
      />
    </Transition>

    <Teleport to="body">
      <UModal
        v-model:open="showDetailModal"
        title="Folder Information"
        :close="{
          color: 'error',
          variant: 'soft',
          size: 'lg',
          label: 'Close',
        }"
        prevent-close
      >
        <template #body>
          <div v-if="selectedFolder" class="px-6 space-y-4">
            <div class="grid grid-cols-1 gap-4">
              <div
                class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
              >
                <span class="font-medium text-gray-600 dark:text-gray-400"
                  >Name:</span
                >
                <span class="text-gray-700 dark:text-gray-300">{{
                  selectedFolder.name
                }}</span>
              </div>

              <div
                v-if="selectedFolder.description"
                class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
              >
                <span class="font-medium text-gray-600 dark:text-gray-400"
                  >Description:</span
                >
                <span class="text-gray-700 dark:text-gray-300">{{
                  selectedFolder.description
                }}</span>
              </div>

              <div
                class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
              >
                <span class="font-medium text-gray-600 dark:text-gray-400"
                  >Path:</span
                >
                <span
                  class="text-gray-700 dark:text-gray-300 font-mono text-sm"
                  >{{ selectedFolder.path }}</span
                >
              </div>

              <div
                class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
              >
                <span class="font-medium text-gray-600 dark:text-gray-400"
                  >Slug:</span
                >
                <span
                  class="text-gray-700 dark:text-gray-300 font-mono text-sm"
                  >{{ selectedFolder.slug }}</span
                >
              </div>

              <div
                class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
              >
                <span class="font-medium text-gray-600 dark:text-gray-400"
                  >Icon:</span
                >
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="selectedFolder.icon || 'i-lucide-folder'"
                    class="w-4 h-4"
                  />
                  <span
                    class="text-gray-900 dark:text-gray-100 font-mono text-sm"
                    >{{ selectedFolder.icon || "i-lucide-folder" }}</span
                  >
                </div>
              </div>

              <div
                class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
              >
                <span class="font-medium text-gray-600 dark:text-gray-400"
                  >Order:</span
                >
                <span class="text-gray-900 dark:text-gray-100">{{
                  selectedFolder.order
                }}</span>
              </div>

              <div
                class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
              >
                <span class="font-medium text-gray-600 dark:text-gray-400"
                  >System:</span
                >
                <UBadge
                  :color="selectedFolder.isSystem ? 'warning' : 'success'"
                  variant="soft"
                >
                  {{ selectedFolder.isSystem ? "Yes" : "No" }}
                </UBadge>
              </div>

              <div
                class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700"
              >
                <span class="font-medium text-gray-600 dark:text-gray-400"
                  >Created:</span
                >
                <span class="text-gray-900 dark:text-gray-100">{{
                  new Date(selectedFolder.createdAt).toLocaleString()
                }}</span>
              </div>

              <div class="flex justify-between py-2">
                <span class="font-medium text-gray-600 dark:text-gray-400"
                  >Updated:</span
                >
                <span class="text-gray-900 dark:text-gray-100">{{
                  new Date(selectedFolder.updatedAt).toLocaleString()
                }}</span>
              </div>
            </div>
          </div>
        </template>
      </UModal>
    </Teleport>
  </div>
</template>
