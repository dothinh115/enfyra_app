<script setup lang="ts">
interface Props {
  folders: any[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  showCreateButton?: boolean;
  parentId?: string;
}

interface Emits {
  refreshFolders: [];
  folderCreated: [];
  createFolder: [];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyTitle: "No folders yet",
  emptyDescription: "Create your first folder to start organizing your files and documents.",
  showCreateButton: true,
  parentId: undefined,
});

const emit = defineEmits<Emits>();

const route = useRoute();
const router = useRouter();

// View mode from query or default to grid
const viewMode = ref<"grid" | "list">(
  (route.query.view as "grid" | "list") || "grid"
);

// Folder management composable for state
const {
  selectedFolders,
  isSelectionMode,
  toggleSelectAll,
  deleteSelectedFolders,
  showDetailModal,
  selectedFolder
} = useFolderManagement();

// Folder table columns composable
const { addActionsColumn } = useFolderTableColumns();

// Handle folder rename
async function handleFolderRename(folderId: string, newName: string) {
  const { execute: updateFolder, error: updateError } = useApiLazy(
    () => `folder_definition/${folderId}`,
    {
      method: "patch",
      errorContext: "Update Folder",
    }
  );

  await updateFolder({ body: { name: newName } });

  if (updateError.value) {
    throw new Error(updateError.value.message || "Failed to update folder");
  }

  // Refresh data
  emit('refreshFolders');
}

// Create columns with actions
const folderColumns = computed(() => {
  return addActionsColumn(() => emit('refreshFolders'), handleFolderRename);
});

// Handle bulk delete
async function handleBulkDelete(selectedRows: any[]) {
  await deleteSelectedFolders(selectedRows, () => emit('refreshFolders'));
}

// Handle row click to navigate to folder
function handleRowClick(folder: any) {
  navigateTo(`/files/folders/${folder.id}`);
}

// Register subheader actions for view mode AND selection actions
useSubHeaderActionRegistry([
  {
    id: "page-view-mode",
    label: computed(() =>
      viewMode.value === "grid" ? "Grid View" : "List View"
    ),
    icon: computed(() =>
      viewMode.value === "grid" ? "lucide:layout-grid" : "lucide:layout-list"
    ),
    onClick: () => {
      const newViewMode = viewMode.value === "grid" ? "list" : "grid";
      viewMode.value = newViewMode;
      // Update URL query
      router.push({
        query: { ...route.query, view: newViewMode }
      });
    },
    side: "left" as const,
    variant: "soft" as const,
    show: true,
  },
  // Selection actions - only show in grid mode
  {
    id: "delete-selected",
    label: computed(() => `Delete (${selectedFolders.value.length})`),
    icon: "lucide:trash",
    color: "error" as const,
    onClick: async () => {
      await deleteSelectedFolders(props.folders, () => emit('refreshFolders'));
    },
    side: "right" as const,
    show: computed(() => {
      return viewMode.value === 'grid' && isSelectionMode.value && selectedFolders.value.length > 0;
    }),
  },
  {
    id: "select-all",
    label: computed(() => {
      const totalCount = props.folders?.length || 0;
      return selectedFolders.value.length === totalCount
        ? "Deselect All"
        : "Select All";
    }),
    icon: computed(() => {
      const totalCount = props.folders?.length || 0;
      return selectedFolders.value.length === totalCount
        ? "lucide:square"
        : "lucide:check-square-2";
    }),
    onClick: () => {
      const totalCount = props.folders?.length || 0;
      toggleSelectAll(totalCount, props.folders);
    },
    side: "right" as const,
    show: computed(() => {
      return viewMode.value === 'grid' && isSelectionMode.value;
    }),
  },
  {
    id: "select-mode",
    icon: computed(() =>
      isSelectionMode.value ? "lucide:x" : "lucide:check-square"
    ),
    label: computed(() => (isSelectionMode.value ? "Cancel" : "Select")),
    variant: computed(() => (isSelectionMode.value ? "solid" : "soft")),
    onClick: () => {
      isSelectionMode.value = !isSelectionMode.value;
      if (!isSelectionMode.value) {
        selectedFolders.value = [];
      }
    },
    side: "right" as const,
    show: computed(() => {
      return viewMode.value === 'grid';
    }),
  },
]);
</script>

<template>
  <div class="space-y-6">
    <!-- Content Area -->
    <div>
      <Transition name="loading-fade" mode="out-in">
        <CommonLoadingState
          v-if="loading"
          title="Loading folders..."
          description="Fetching folder structure"
          size="md"
          type="folder"
          context="page"
        />

        <!-- Grid View -->
        <div v-else-if="viewMode === 'grid' && folders.length > 0">
          <FolderCardGrid
            :folders="folders"
            :view-mode="viewMode"
            @refresh-folders="emit('refreshFolders')"
          />
        </div>

        <!-- List View -->
        <div v-else-if="viewMode === 'list' && folders.length > 0">
          <DataTable
            :data="folders"
            :columns="folderColumns"
            :loading="false"
            :page-size="50"
            :selectable="true"
            @bulk-delete="handleBulkDelete"
            @row-click="handleRowClick"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center py-16">
          <div
            class="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6"
          >
            <UIcon
              name="lucide:folder-x"
              class="w-16 h-16 text-gray-400 dark:text-gray-500"
            />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {{ emptyTitle }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
            {{ emptyDescription }}
          </p>
          <UButton
            v-if="showCreateButton"
            icon="lucide:folder-plus"
            size="lg"
            @click="emit('createFolder')"
          >
            Create First Folder
          </UButton>
        </div>
      </Transition>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <UModal v-model:open="showDetailModal">
        <template #header>
          <div class="flex justify-between items-center w-full">
            <div class="text-base font-semibold">Folder Information</div>
            <UButton
              icon="lucide:x"
              color="error"
              variant="soft"
              @click="showDetailModal = false"
            >
              Close
            </UButton>
          </div>
        </template>
        <template #body>
          <div v-if="selectedFolder">
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