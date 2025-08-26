<template>
  <div class="space-y-4">
    <!-- Grid View -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <!-- Folder Items Container -->
      <div v-if="transformedFolders.length > 0" class="contents">
        <div
          v-for="folder in transformedFolders"
          :key="folder.id"
          class="group relative"
          @mouseenter="hoveredFolderId = folder.id"
          @mouseleave="hoveredFolderId = null"
        >
          <!-- Card Container with Context Menu -->
          <UContextMenu :items="getContextMenuItems(folder)">
            <div
              class="relative bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col"
              :class="[
                selectedItems.includes(folder.id)
                  ? 'border-primary-500 shadow-lg shadow-primary-500/20 scale-[1.02]'
                  : hoveredFolderId === folder.id
                  ? 'border-primary-300 dark:border-primary-600 shadow-xl transform -translate-y-1'
                  : 'border-gray-200 dark:border-gray-700 shadow-sm lg:hover:shadow-lg',
                isFolderDisabled(folder.id)
                  ? 'opacity-60 cursor-not-allowed'
                  : '',
              ]"
              @click="handleFolderClick(folder)"
            >
              <!-- Disabled overlay when folder is part of moving selection -->
              <div
                v-if="isFolderDisabled(folder.id)"
                class="absolute inset-0 z-10 bg-black/20 flex items-center justify-center"
                aria-disabled="true"
                title="Selected folder cannot be destination"
              >
                <span
                  class="inline-flex items-center gap-2 text-xs font-medium text-white/95 bg-amber-600/80 px-2.5 py-1 rounded-md"
                >
                  <UIcon name="lucide:lock" class="w-3.5 h-3.5" />
                  Selected - cannot move here
                </span>
              </div>
              <!-- Selection Checkbox -->
              <div
                v-if="isSelectionMode"
                class="absolute top-3 right-3 z-20 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md"
                @click.stop
              >
                <UCheckbox
                  :model-value="selectedItems.includes(folder.id)"
                  @update:model-value="() => toggleItemSelection(folder.id)"
                  size="lg"
                />
              </div>

              <!-- Card Header with Gradient -->
              <div
                class="relative h-32 p-6 flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
              >
                <!-- Background Pattern -->
                <div class="absolute inset-0 opacity-10">
                  <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <pattern
                      id="grid"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="10" cy="10" r="1" fill="currentColor" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                <!-- Folder Icon -->
                <div class="flex justify-center items-center p-4">
                  <UIcon
                    :name="getFolderIcon(folder).name"
                    :size="96"
                    class="transition-all duration-300"
                    :class="[
                      getFolderIcon(folder).color,
                      hoveredFolderId === folder.id ? 'scale-110 rotate-3' : '',
                    ]"
                  />
                </div>

                <!-- Hover Effect Overlay -->
                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>

              <!-- Card Body -->
              <div class="p-4 space-y-3 flex-1 flex flex-col">
                <!-- Folder Name -->
                <div class="flex items-start justify-between gap-2">
                  <!-- Inline Edit Mode -->
                  <div
                    v-if="editingFolderId === folder.id"
                    class="flex items-center gap-1 flex-1"
                  >
                    <input
                      v-model="editingName"
                      @keyup.enter="!editingLoading && saveEdit(folder)"
                      @keyup.escape="!editingLoading && cancelEdit()"
                      :disabled="editingLoading"
                      :data-editing-id="folder.id"
                      class="flex-1 text-sm font-semibold bg-white dark:bg-gray-700 border border-primary rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      @click.stop
                    />
                    <div v-if="editingLoading" class="flex items-center">
                      <UIcon
                        name="lucide:loader-2"
                        class="w-4 h-4 animate-spin text-primary"
                      />
                    </div>
                    <div v-else class="flex items-center gap-1">
                      <UButton
                        v-if="editingName.trim() !== originalName"
                        icon="lucide:check"
                        size="xs"
                        color="success"
                        variant="solid"
                        @click.stop="saveEdit(folder)"
                        class="!p-1 !min-w-[24px] !w-6 !h-6 flex items-center justify-center"
                      />
                      <UButton
                        icon="lucide:x"
                        size="xs"
                        color="error"
                        variant="solid"
                        @click.stop="cancelEdit()"
                        class="!p-1 !min-w-[24px] !w-6 !h-6 flex items-center justify-center"
                      />
                    </div>
                  </div>

                  <!-- Normal Display Mode -->
                  <div
                    v-else
                    class="flex items-center justify-between gap-2 flex-1"
                  >
                    <h3
                      class="font-semibold text-gray-900 dark:text-white truncate flex-1"
                      :title="folder.name"
                      @dblclick="startRename(folder)"
                    >
                      {{ folder.name }}
                    </h3>
                    <UButton
                      icon="lucide:edit-3"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @click.stop="startRename(folder)"
                      class="opacity-0 lg:group-hover:opacity-100 transition-opacity ml-1"
                    />
                  </div>

                  <UBadge
                    v-if="folder.isSystem"
                    color="warning"
                    variant="soft"
                    size="xs"
                  >
                    System
                  </UBadge>
                </div>

                <!-- Folder Description -->
                <p
                  v-if="folder.description"
                  class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                  :title="folder.description"
                >
                  {{ folder.description }}
                </p>

                <!-- Folder Stats -->
                <div
                  class="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500"
                >
                  <div class="flex items-center gap-1">
                    <UIcon name="lucide:calendar" class="w-3 h-3" />
                    <span>{{ formatDate(folder.createdAt) }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <UIcon name="lucide:folder" class="w-3 h-3" />
                    <span>{{ folder.fileCount || 0 }} items</span>
                  </div>
                </div>

                <!-- Quick Actions (visible on hover) -->
                <div
                  class="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 mt-auto"
                >
                  <UButton
                    icon="lucide:folder-open"
                    size="xs"
                    variant="soft"
                    color="primary"
                    :disabled="isFolderDisabled(folder.id)"
                    :class="
                      isFolderDisabled(folder.id)
                        ? 'opacity-60 cursor-not-allowed'
                        : ''
                    "
                    @click.stop="handleFolderClick(folder)"
                    class="flex-1"
                  >
                    Open
                  </UButton>
                  <UDropdownMenu :items="getDropdownMenuItems(folder)">
                    <UButton
                      icon="lucide:more-vertical"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @click.stop
                    />
                  </UDropdownMenu>
                </div>
              </div>
            </div>
          </UContextMenu>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="col-span-full text-center py-12">
        <UIcon
          name="lucide:folder"
          class="w-16 h-16 text-muted-foreground mx-auto mb-4"
        />
        <p class="text-lg font-medium text-muted-foreground">
          {{ emptyTitle }}
        </p>
        <p class="text-sm text-muted-foreground mt-1">
          {{ emptyDescription }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from "~/utils/common/filter/filter-helpers";

interface Props {
  folders: any[];
  emptyTitle?: string;
  emptyDescription?: string;
  isSelectionMode?: boolean;
  selectedItems?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  emptyTitle: "No folders",
  emptyDescription: "No folders in this location",
  isSelectionMode: false,
  selectedItems: () => [],
});

// Transform folders data for display
const transformedFolders = computed(() => {
  return props.folders.map((folder: any) => ({
    ...folder,
    fileCount: folder.children?.length || folder.files?.length || 0,
  }));
});

// Access global move state to disable folders under move
const moveState = useState("file-move-state", () => ({
  moveMode: false as boolean,
  selectedFolderIds: [] as string[],
}));

function isFolderDisabled(folderId: string) {
  return !!(
    moveState.value.moveMode &&
    moveState.value.selectedFolderIds?.includes(folderId)
  );
}

const emit = defineEmits<{
  "folder-click": [folder: any];
  "toggle-selection": [folderId: string];
  "refresh-folders": [];
}>();

// Hover state for cards
const hoveredFolderId = ref<string | null>(null);

// Inline editing state
const editingFolderId = ref<string | null>(null);
const editingName = ref("");
const originalName = ref("");
const editingLoading = ref(false);

// Import folder management for folder details
const { showFolderDetail } = useFileManager();

// Import confirm for delete confirmation
const { confirm } = useConfirm();

// Import permissions
const { checkPermissionCondition } = usePermissions();

// Check delete permission for folders
const canDeleteFolder = checkPermissionCondition({
  and: [
    {
      route: "/folder_definition",
      actions: ["delete"],
    },
  ],
});

// Delete folder API at setup level
const { execute: executeDeleteFolder } = useApiLazy(
  () => `/folder_definition`,
  {
    method: "delete",
    errorContext: "Delete Folder",
  }
);

// Update folder API at setup level
const { execute: executeUpdateFolder, error: updateError } = useApiLazy(
  () => `/folder_definition`,
  {
    method: "patch",
    errorContext: "Update Folder",
  }
);

function handleFolderClick(folder: any) {
  if (props.isSelectionMode) {
    toggleItemSelection(folder.id);
  } else {
    emit("folder-click", folder);
  }
}

function toggleItemSelection(folderId: string) {
  emit("toggle-selection", folderId);
}

// Show folder detail function
function showDetail(folder: any) {
  showFolderDetail(folder);
}

// Inline rename functions
function startRename(folder: any) {
  if (props.isSelectionMode) return;
  editingFolderId.value = folder.id;
  editingName.value = folder.name;
  originalName.value = folder.name;

  nextTick(() => {
    const input = document.querySelector(
      `input[data-editing-id="${folder.id}"]`
    ) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function cancelEdit() {
  if (editingLoading.value) return;
  editingFolderId.value = null;
  editingName.value = "";
  originalName.value = "";
  editingLoading.value = false;
}

// Delete folder function
async function deleteFolder(folder: any) {
  const isConfirmed = await confirm({
    title: "Delete Folder",
    content: `Are you sure you want to delete "${folder.name}"? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (!isConfirmed) return;

  await executeDeleteFolder({ id: folder.id });
  emit("refresh-folders");
}

async function saveEdit(folder: any) {
  if (!editingName.value.trim()) {
    return;
  }

  editingLoading.value = true;

  await executeUpdateFolder({
    id: folder.id,
    body: { name: editingName.value.trim() },
  });

  if (updateError.value) {
    editingLoading.value = false;
    return;
  }

  editingFolderId.value = null;
  editingName.value = "";
  originalName.value = "";
  editingLoading.value = false;

  // Refresh the list
  emit("refresh-folders");
}

// Get context menu items for folders
function getContextMenuItems(folder: any) {
  const menuItems: any = [
    [
      {
        label: "Open",
        icon: "lucide:folder-open",
        onSelect: () => {
          emit("folder-click", folder);
        },
      },

      {
        label: "Rename",
        icon: "lucide:edit-3",
        onSelect: () => {
          startRename(folder);
        },
      },

      {
        label: "Details",
        icon: "lucide:info",
        onSelect: () => {
          showDetail(folder);
        },
      },
    ],
  ];

  // Only show delete option if user has permission
  if (canDeleteFolder) {
    menuItems.push([
      {
        label: "Delete",
        icon: "lucide:trash-2",
        color: "error" as const,
        onSelect: () => {
          deleteFolder(folder);
        },
      },
    ]);
  }

  return menuItems;
}

// Get dropdown menu items (flat array)
function getDropdownMenuItems(folder: any) {
  const menuItems: any = [
    {
      label: "Open",
      icon: "lucide:folder-open",
      onSelect: () => {
        emit("folder-click", folder);
      },
    },
    {
      label: "Rename",
      icon: "lucide:edit-3",
      onSelect: () => {
        startRename(folder);
      },
    },
    {
      label: "Details",
      icon: "lucide:info",
      onSelect: () => {
        showDetail(folder);
      },
    },
  ];

  if (canDeleteFolder) {
    menuItems.push({
      label: "Delete",
      icon: "lucide:trash-2",
      color: "error" as const,
      onSelect: () => {
        deleteFolder(folder);
      },
    });
  }

  return menuItems;
}

// Get folder icon with color
function getFolderIcon(folder: any) {
  if (folder.isSystem) {
    return {
      name: folder.icon || "lucide:shield",
      color: "text-amber-500 dark:text-amber-400",
    };
  }

  return {
    name: folder.icon || "lucide:folder",
    color: "text-blue-500 dark:text-blue-400",
  };
}
</script>
