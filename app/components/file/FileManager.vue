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

// Persisted move state across navigation
const moveState = useState("file-move-state", () => ({
  moveMode: false as boolean,
  sourceFolderId: null as string | null,
  selectedItems: [] as string[],
  selectedFileIds: [] as string[],
  selectedFolderIds: [] as string[],
}));

const isMoveMode = computed(() => moveState.value.moveMode);
const sourceFolderId = computed(() => moveState.value.sourceFolderId);

const selectedFolders = useState<string[]>("folder-selected-list", () => []);
const { confirm } = useConfirm();

function handleFolderClick(folder: any) {
  // When in move mode, prevent navigating into a folder that is being moved
  if (
    moveState.value.moveMode &&
    (moveState.value.selectedFolderIds || []).includes(folder.id)
  ) {
    const toast = useToast();
    toast.add({
      title: "Cannot navigate",
      description: "You cannot move a folder into itself.",
      color: "warning",
    });
    return;
  }
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

// Ensure selection is restored when returning while in move mode
onMounted(() => {
  if (moveState.value.moveMode && moveState.value.selectedItems.length > 0) {
    selectedItems.value = [...moveState.value.selectedItems];
    isSelectionMode.value = true; // Cũng cần restore cái này
  }
});

function startMoveMode() {
  if (selectedItems.value.length === 0) return;
  // Capture current folder as source
  if (!moveState.value.sourceFolderId) {
    moveState.value.sourceFolderId =
      props.parentId || (route.params.id as string);
  }
  moveState.value.selectedItems = [...selectedItems.value];
  // Split ids by type for stable counts display across navigation
  moveState.value.selectedFolderIds = selectedItems.value.filter((id) =>
    props.folders.find((f) => f.id === id)
  );
  moveState.value.selectedFileIds = selectedItems.value.filter((id) =>
    props.files.find((f) => f.id === id)
  );
  moveState.value.moveMode = true;
  // Allow navigation between folders while in move mode
  isSelectionMode.value = false;
}

function cancelMoveMode() {
  moveState.value.moveMode = false;
  moveState.value.selectedItems = [];
  moveState.value.selectedFileIds = [];
  moveState.value.selectedFolderIds = [];
  moveState.value.sourceFolderId = null;
  // keep local selection so user can continue if they want
  selectedItems.value = [];
}

function clearAllFileManagerState() {
  // Clear move state
  moveState.value.moveMode = false;
  moveState.value.selectedItems = [];
  moveState.value.selectedFileIds = [] as string[];
  moveState.value.selectedFolderIds = [] as string[];
  moveState.value.sourceFolderId = null;
  // Clear local selections and flags
  selectedItems.value = [];
  isSelectionMode.value = false;
  // Any persisted selected folders for bulk delete
  selectedFolders.value = [];
}

const currentFolderId = computed(
  () => props.parentId || (route.params.id as string | undefined)
);

const isMoveHereDisabled = computed(() => {
  // Disabled if not in move mode, or destination equals source (including root↔root)
  return (
    !moveState.value.moveMode ||
    currentFolderId.value === moveState.value.sourceFolderId
  );
});

// API instances defined in setup (per AI_MEMORY_FE convention)
const {
  execute: patchFiles,
  error: patchFilesError,
  pending: patchFilesPending,
} = useApiLazy(() => "/file_definition", {
  method: "patch",
  errorContext: "Move Files",
});
const {
  execute: patchFolders,
  error: patchFoldersError,
  pending: patchFoldersPending,
} = useApiLazy(() => "/folder_definition", {
  method: "patch",
  errorContext: "Move Folders",
});

const isAnyMovePending = computed(
  () => !!(patchFilesPending.value || patchFoldersPending.value)
);

async function handleMoveHere() {
  if (isMoveHereDisabled.value) {
    return;
  }

  const folderIds = [...(moveState.value.selectedFolderIds || [])];
  const fileIds = [...(moveState.value.selectedFileIds || [])];

  if (folderIds.length === 0 && fileIds.length === 0) return;

  const destinationId =
    props.parentId || (route.params.id as string | undefined);

  const totalCount = fileIds.length + folderIds.length;
  const isConfirmed = await confirm({
    title: "Move items",
    content: `Are you sure you want to move ${totalCount} item(s) here?`,
    confirmText: "Move",
    cancelText: "Cancel",
  });
  if (!isConfirmed) return;

  if (destinationId && folderIds.includes(destinationId)) {
    const toast = useToast();
    toast.add({
      title: "Invalid move",
      description: "A folder cannot be moved into itself.",
      color: "warning",
    });
    return;
  }

  let hasError = false;

  if (fileIds.length > 0) {
    const fileBody = destinationId
      ? { folder: { id: destinationId } }
      : { folder: null };
    await patchFiles({ ids: fileIds, body: fileBody });
    if (patchFilesError.value) {
      hasError = true;
    }
  }

  if (folderIds.length > 0 && !hasError) {
    const folderBody = destinationId
      ? { parent: { id: destinationId } }
      : { parent: null };
    await patchFolders({ ids: folderIds, body: folderBody });
    if (patchFoldersError.value) {
      hasError = true;
    }
  }

  if (!hasError) {
    const toast = useToast();
    const totalCount = moveState.value.selectedItems.length;
    toast.add({
      title: "Success",
      description: `${totalCount} item(s) moved successfully!`,
      color: "success",
    });

    emit("refreshItems");

    // Clear state
    selectedItems.value = [];
    cancelMoveMode();
    isSelectionMode.value = false;
  }
  if (hasError) {
    const toast = useToast();
    toast.add({
      title: "Move failed",
      description: "Please try again.",
      color: "error",
    });
  }
}

// onBeforeRouteLeave((to) => {
//   if (!to.path.startsWith("/files/management")) {
//     clearAllFileManagerState();
//   }
// });

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
      // Do not persist view mode on URL query to avoid breaking back button behavior
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
    show: computed(() => viewMode.value === "grid" && !isMoveMode.value),
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
        selectedItems.value.length > 0 &&
        !isMoveMode.value
    ),
  },
  {
    id: "start-move",
    label: "Move",
    icon: "lucide:arrow-right-left",
    variant: "outline",
    onClick: startMoveMode,
    side: "right",
    show: computed(
      () =>
        viewMode.value === "grid" &&
        isSelectionMode.value &&
        selectedItems.value.length > 0 &&
        !isMoveMode.value
    ),
  },
  {
    id: "move-here",
    label: computed(() => {
      const files = moveState.value.selectedFileIds?.length || 0;
      const folders = moveState.value.selectedFolderIds?.length || 0;
      const countLabel =
        files + folders > 0 ? ` (${files} files, ${folders} folders)` : "";
      return (isAnyMovePending.value ? "Moving..." : "Move here") + countLabel;
    }),
    icon: "lucide:folder-input",
    variant: "solid",
    color: "primary",
    loading: computed(() => isAnyMovePending.value),
    disabled: computed(
      () => isMoveHereDisabled.value || isAnyMovePending.value
    ),
    onClick: handleMoveHere,
    side: "right",
    show: computed(() => viewMode.value === "grid" && isMoveMode.value),
  },
  {
    id: "cancel-move",
    label: "Cancel",
    icon: "lucide:x",
    variant: "ghost",
    onClick: cancelMoveMode,
    side: "right",
    show: computed(() => viewMode.value === "grid" && isMoveMode.value),
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
