<script setup lang="ts">
interface Props {
  parentId?: string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  showCreateButton?: boolean;
}

interface Emits {
  refreshItems: [];
  createFolder: [];
  createFile: [];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyTitle: "No items yet",
  emptyDescription:
    "This folder is empty. Create folders or upload files to get started.",
  showCreateButton: true,
  parentId: undefined,
});

const emit = defineEmits<Emits>();

const route = useRoute();
const router = useRouter();

// File manager composable
const { items, pending, fetchAll } = useFileManager(props.parentId);

// View mode - get from query first, then localStorage, then default to grid
const getInitialViewMode = (): "grid" | "list" => {
  // Priority: URL query > localStorage > default
  if (route.query.view) {
    return route.query.view as "grid" | "list";
  }

  if (process.client) {
    const saved = localStorage.getItem("file-manager-view-mode");
    if (saved === "grid" || saved === "list") {
      return saved;
    }
  }

  return "grid";
};

const viewMode = ref<"grid" | "list">(getInitialViewMode());

// Selection state
const isSelectionMode = ref(false);
const selectedItems = ref<string[]>([]);

// Folder management composable for state
const { deleteSelectedFolders } = useFolderManagement();

// Computed loading state
const isLoading = computed(() => props.loading || pending.value);

// Separate folders and files
const folderItems = computed(() =>
  items.value.filter((item) => item.itemType === "folder")
);

const fileItems = computed(() =>
  items.value.filter((item) => item.itemType === "file")
);

// Handle item click
function handleItemClick(item: any) {
  if (item.itemType === "folder") {
    navigateTo(`/files/management/${item.id}`);
  } else {
    // Handle file click - show preview or details
    console.log("File clicked:", item);
    // Could show preview modal or file details
  }
}

// Toggle item selection
function toggleItemSelection(itemId: string) {
  const index = selectedItems.value.indexOf(itemId);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(itemId);
  }
}

// Show item context menu
function showItemMenu(item: any, event: Event) {
  console.log("Show menu for item:", item, event);
  // Could implement context menu here
}

// Handle bulk delete
async function handleBulkDelete() {
  if (selectedItems.value.length === 0) return;

  // Separate folders and files
  const folderIds = selectedItems.value.filter(
    (id) => items.value.find((item) => item.id === id)?.itemType === "folder"
  );
  const fileIds = selectedItems.value.filter(
    (id) => items.value.find((item) => item.id === id)?.itemType === "file"
  );

  // Delete folders (existing logic)
  if (folderIds.length > 0) {
    const foldersToDelete = items.value.filter(
      (item) => folderIds.includes(item.id) && item.itemType === "folder"
    );
    await deleteSelectedFolders(foldersToDelete, () => emit("refreshItems"));
  }

  // Delete files
  if (fileIds.length > 0) {
    try {
      // Delete files one by one
      for (const fileId of fileIds) {
        const { execute: deleteFile, error } = useApiLazy(
          () => `file_definition/${fileId}`,
          {
            method: "delete",
            errorContext: "Delete File",
          }
        );

        await deleteFile();

        if (error.value) {
          console.error(`Failed to delete file ${fileId}:`, error.value);
          // Continue with other files even if one fails
        }
      }

      // Show success message
      const toast = useToast();
      toast.add({
        title: "Success",
        description: `${fileIds.length} file(s) deleted successfully`,
        color: "success",
      });

      // Refresh the file list
      await fetchAll();
      emit("refreshItems");
    } catch (error) {
      console.error("Error deleting files:", error);
      const toast = useToast();
      toast.add({
        title: "Error",
        description: "Failed to delete some files",
        color: "error",
      });
    }
  }

  // Clear selection
  selectedItems.value = [];
  isSelectionMode.value = false;
}

// Execute API call when component mounts
onMounted(() => {
  fetchAll();
});

// Register subheader actions for view mode AND selection actions
useSubHeaderActionRegistry([
  {
    id: "page-view-mode",
    label: computed(() =>
      viewMode.value === "grid" ? "List View" : "Grid View"
    ),
    icon: computed(() =>
      viewMode.value === "grid" ? "lucide:layout-list" : "lucide:layout-grid"
    ),
    onClick: () => {
      const newViewMode = viewMode.value === "grid" ? "list" : "grid";
      viewMode.value = newViewMode;

      // Save to localStorage
      if (process.client) {
        localStorage.setItem("file-manager-view-mode", newViewMode);
      }

      // Update URL query
      router.push({
        query: { ...route.query, view: newViewMode },
      });
    },
    side: "left",
  },
  {
    id: "toggle-selection",
    label: computed(() =>
      isSelectionMode.value ? "Cancel Selection" : "Select Items"
    ),
    icon: computed(() =>
      isSelectionMode.value ? "lucide:x" : "lucide:check-square"
    ),
    onClick: () => {
      isSelectionMode.value = !isSelectionMode.value;
      if (!isSelectionMode.value) {
        selectedItems.value = [];
      }
    },
    side: "right",
  },
  {
    id: "bulk-delete",
    label: "Delete Selected",
    icon: "lucide:trash-2",
    variant: "outline",
    color: "error",
    onClick: handleBulkDelete,
    side: "right",
    show: computed(
      () => isSelectionMode.value && selectedItems.value.length > 0
    ),
  },
  {
    id: "select-all",
    label: computed(() => {
      const totalCount = items.value?.length || 0;
      return selectedItems.value.length === totalCount
        ? "Deselect All"
        : "Select All";
    }),
    icon: computed(() => {
      const totalCount = items.value?.length || 0;
      return selectedItems.value.length === totalCount
        ? "lucide:square"
        : "lucide:check-square";
    }),
    onClick: () => {
      const totalCount = items.value?.length || 0;
      if (selectedItems.value.length === totalCount) {
        selectedItems.value = [];
      } else {
        selectedItems.value = items.value.map((item) => item.id);
      }
    },
    side: "right",
    show: computed(() => isSelectionMode.value),
  },
]);
</script>

<template>
  <div class="space-y-6">
    <!-- Content -->
    <div class="min-h-[400px] space-y-8">
      <!-- Loading state -->
      <CommonLoadingState
        v-if="isLoading"
        title="Loading files and folders..."
        description="Fetching folder structure and files"
        size="md"
      />

      <div v-else class="space-y-8">
        <!-- Folders Section -->
        <div v-if="folderItems.length > 0">
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="lucide:folder" class="w-5 h-5 text-blue-500" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Folders
            </h2>
            <UBadge color="primary" variant="soft" size="sm">
              {{ folderItems.length }}
            </UBadge>
          </div>

          <FolderGrid
            :folders="folderItems"
            :view-mode="viewMode"
            :loading="isLoading"
            empty-title="No folders"
            empty-description="No folders in this location"
            :is-selection-mode="isSelectionMode"
            :selected-items="selectedItems"
            @folder-click="handleItemClick"
            @toggle-selection="toggleItemSelection"
            @refresh-folders="fetchAll"
          />
        </div>

        <!-- Files Section -->
        <div v-if="fileItems.length > 0">
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="lucide:file" class="w-5 h-5 text-gray-500" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Files
            </h2>
            <UBadge color="neutral" variant="soft" size="sm">
              {{ fileItems.length }}
            </UBadge>
          </div>

          <FileGrid
            :files="fileItems"
            :view-mode="viewMode"
            :loading="isLoading"
            empty-title="No files"
            empty-description="No files in this location"
            :is-selection-mode="isSelectionMode"
            :selected-items="selectedItems"
            @file-click="handleItemClick"
            @toggle-selection="toggleItemSelection"
            @refresh-files="fetchAll"
          />
        </div>

        <!-- Empty state when both are empty -->
        <div
          v-if="folderItems.length === 0 && fileItems.length === 0"
          class="text-center py-12"
        >
          <UIcon
            name="lucide:folder-open"
            class="w-16 h-16 text-gray-400 mx-auto mb-4"
          />
          <p class="text-lg font-medium text-gray-500">{{ emptyTitle }}</p>
          <p class="text-sm text-gray-400 mt-1">{{ emptyDescription }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
