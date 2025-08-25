<script setup lang="ts">
interface Props {
  parentId?: string;
  folders?: any[];
  files?: any[];
  foldersLoading?: boolean;
  filesLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  showCreateButton?: boolean;
}

interface Emits {
  refreshItems: [];
  refreshFolders: [];
  refreshFiles: [];
  createFolder: [];
  createFile: [];
}

const props = withDefaults(defineProps<Props>(), {
  foldersLoading: false,
  filesLoading: false,
  folders: () => [],
  files: () => [],
  emptyTitle: "No items yet",
  emptyDescription:
    "This folder is empty. Create folders or upload files to get started.",
  showCreateButton: true,
  parentId: undefined,
});

const emit = defineEmits<Emits>();

const route = useRoute();
const router = useRouter();

const getInitialViewMode = (): "grid" | "list" => {
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

const isSelectionMode = ref(false);
const selectedItems = ref<string[]>([]);

const selectedFolders = useState<string[]>("folder-selected-list", () => []);
const { confirm } = useConfirm();

function handleFolderClick(folder: any) {
  navigateTo(`/files/management/${folder.id}`);
}

function handleFileClick(file: any) {
  // Navigate to file detail page
  navigateTo(`/files/${file.id}`);
}

function toggleItemSelection(itemId: string) {
  const index = selectedItems.value.indexOf(itemId);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(itemId);
  }
}

async function handleBulkDelete() {
  if (selectedItems.value.length === 0) return;

  const folderIds = selectedItems.value.filter((id) =>
    props.folders.find((folder) => folder.id === id)
  );
  const fileIds = selectedItems.value.filter((id) =>
    props.files.find((file) => file.id === id)
  );

  const folderNames = folderIds
    .map((id) => props.folders.find((f) => f.id === id)?.name)
    .filter(Boolean);
  const fileNames = fileIds
    .map(
      (id) =>
        props.files.find((f) => f.id === id)?.filename ||
        props.files.find((f) => f.id === id)?.displayName
    )
    .filter(Boolean);

  const allNames = [...folderNames, ...fileNames];
  const totalCount = selectedItems.value.length;

  const isConfirmed = await confirm({
    title: "Delete Multiple Items",
    content: `Are you sure you want to delete ${totalCount} item(s)? This includes: ${allNames
      .slice(0, 3)
      .join(", ")}${
      allNames.length > 3 ? ` and ${allNames.length - 3} more` : ""
    }. This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (!isConfirmed) return;

  let deletionErrors = false;

  if (folderIds.length > 0) {
    selectedFolders.value = folderIds;
    const { execute: deleteFolderApi, error: deleteFolderError } = useApiLazy(
      () => "/folder_definition",
      { method: "delete", errorContext: "Delete Folder" }
    );

    await deleteFolderApi({ ids: folderIds });
    if (deleteFolderError.value) {
      deletionErrors = true;
    }
  }

  if (fileIds.length > 0 && !deletionErrors) {
    const { execute: deleteFileApi, error: deleteFileError } = useApiLazy(
      () => "/file_definition",
      { method: "delete", errorContext: "Delete File" }
    );

    await deleteFileApi({ ids: fileIds });
    if (deleteFileError.value) {
      deletionErrors = true;
    }
  }

  if (!deletionErrors) {
    emit("refreshItems");
    selectedItems.value = [];
    isSelectionMode.value = false;

    const toast = useToast();
    toast.add({
      title: "Success",
      description: `${totalCount} item(s) deleted successfully!`,
      color: "success",
    });
  }
}

// Register subheader actions
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

      if (process.client) {
        localStorage.setItem("file-manager-view-mode", newViewMode);
      }

      router.push({
        query: { ...route.query, view: newViewMode },
        replace: true,
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
    show: computed(() => viewMode.value === "grid"),
    permission: {
      and: [
        {
          route: "/folder_definition",
          actions: ["delete"],
        },
        {
          route: "/file_definition",
          actions: ["delete"],
        },
      ],
    },
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
      () =>
        viewMode.value === "grid" &&
        isSelectionMode.value &&
        selectedItems.value.length > 0
    ),
  },
  {
    id: "select-all",
    label: computed(() => {
      const totalCount =
        (props.folders?.length || 0) + (props.files?.length || 0);
      return selectedItems.value.length === totalCount
        ? "Deselect All"
        : "Select All";
    }),
    icon: computed(() => {
      const totalCount =
        (props.folders?.length || 0) + (props.files?.length || 0);
      return selectedItems.value.length === totalCount
        ? "lucide:square"
        : "lucide:check-square";
    }),
    color: computed(() => {
      const totalCount =
        (props.folders?.length || 0) + (props.files?.length || 0);
      return selectedItems.value.length === totalCount ? "warning" : "primary";
    }),
    onClick: () => {
      const totalCount =
        (props.folders?.length || 0) + (props.files?.length || 0);
      if (selectedItems.value.length === totalCount) {
        selectedItems.value = [];
      } else {
        const allItems = [...props.folders, ...props.files];
        selectedItems.value = allItems.map((item) => item.id);
      }
    },
    side: "right",
    show: computed(() => viewMode.value === "grid" && isSelectionMode.value),
  },
]);
</script>

<template>
  <div class="space-y-6">
    <!-- Content -->
    <div class="min-h-[400px] space-y-8">
      <div class="space-y-8">
        <!-- Folders Section -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="lucide:folder" class="w-5 h-5 text-blue-500" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Folders
            </h2>
          </div>

          <FolderView
            :folders="props.folders"
            :view-mode="viewMode"
            :loading="props.foldersLoading && props.folders.length === 0"
            empty-title="No folders"
            empty-description="No folders in this location"
            :is-selection-mode="isSelectionMode"
            :selected-items="selectedItems"
            @folder-click="handleFolderClick"
            @toggle-selection="toggleItemSelection"
            @refresh-folders="() => emit('refreshFolders')"
          />
        </div>

        <!-- Files Section -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="lucide:file" class="w-5 h-5 text-gray-500" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Files
            </h2>
          </div>

          <FileView
            :files="props.files"
            :view-mode="viewMode"
            :loading="props.filesLoading && props.files.length === 0"
            empty-title="No files"
            empty-description="No files in this location"
            :is-selection-mode="isSelectionMode"
            :selected-items="selectedItems"
            @file-click="handleFileClick"
            @toggle-selection="toggleItemSelection"
            @refresh-files="() => emit('refreshFiles')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
