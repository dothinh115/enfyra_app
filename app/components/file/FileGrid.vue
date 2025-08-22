<template>
  <div class="space-y-4">
    <!-- Grid View -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <!-- File Items Container -->
      <div v-if="transformedFiles.length > 0" class="contents">
        <div
          v-for="file in transformedFiles"
          :key="file.id"
          class="group relative"
          @mouseenter="hoveredFileId = file.id"
          @mouseleave="hoveredFileId = null"
        >
          <!-- Card Container with Context Menu -->
          <UContextMenu :items="getContextMenuItems(file)">
            <div
              class="relative bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
              :class="[
                selectedItems.includes(file.id)
                  ? 'border-primary-500 shadow-lg shadow-primary-500/20 scale-[1.02]'
                  : hoveredFileId === file.id
                  ? 'border-primary-300 dark:border-primary-600 shadow-xl transform -translate-y-1'
                  : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg',
              ]"
              @click="handleFileClick(file)"
            >
              <!-- Selection Checkbox -->
              <div
                v-if="isSelectionMode"
                class="absolute top-3 right-3 z-20 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md"
                @click.stop
              >
                <UCheckbox
                  :model-value="selectedItems.includes(file.id)"
                  @update:model-value="() => toggleItemSelection(file.id)"
                  size="lg"
                />
              </div>

              <!-- Card Header with Gradient -->
              <div
                class="relative h-32 p-6 flex items-center justify-center overflow-hidden"
                :class="[
                  file.type === 'image'
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                    : 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
                ]"
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

                <!-- Image preview for image files -->
                <div
                  v-if="isImageFile(file)"
                  class="relative w-20 h-20 rounded-lg overflow-hidden bg-white dark:bg-gray-700 shadow-lg"
                >
                  <img
                    :src="file.assetUrl"
                    :alt="file.displayName"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    @error="handleImageError"
                  />
                </div>

                <!-- Icon for other files -->
                <div v-else class="flex justify-center items-center p-4">
                  <UIcon
                    :name="file.icon"
                    :size="96"
                    class="transition-all duration-300"
                    :class="[
                      getFileColor(file),
                      hoveredFileId === file.id ? 'scale-110 rotate-3' : '',
                    ]"
                  />
                </div>

                <!-- Hover Effect Overlay -->
                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>

              <!-- Card Body -->
              <div class="p-4 space-y-3">
                <!-- File Name -->
                <div class="flex items-start justify-between gap-2">
                  <!-- Inline Edit Mode -->
                  <div
                    v-if="editingFileId === file.id"
                    class="flex items-center gap-1 flex-1"
                  >
                    <input
                      v-model="editingName"
                      @keyup.enter="!editingLoading && saveEdit(file)"
                      @keyup.escape="!editingLoading && cancelEdit()"
                      :disabled="editingLoading"
                      :data-editing-id="file.id"
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
                        @click.stop="saveEdit(file)"
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
                      :title="file.displayName"
                      @dblclick="startRename(file)"
                    >
                      {{ file.displayName }}
                    </h3>
                    <UButton
                      icon="lucide:edit-3"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @click.stop="startRename(file)"
                      class="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    />
                  </div>
                </div>

                <!-- File Stats -->
                <div
                  class="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500"
                >
                  <div class="flex items-center gap-1">
                    <UIcon name="lucide:calendar" class="w-3 h-3" />
                    <span>{{ formatDate(file.modifiedAt) }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <UIcon name="lucide:file" class="w-3 h-3" />
                    <span>{{ file.size }}</span>
                  </div>
                </div>

                <!-- Quick Actions (visible on hover) -->
                <div
                  class="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <UButton
                    icon="lucide:eye"
                    size="xs"
                    variant="soft"
                    color="primary"
                    @click.stop="viewFile(file)"
                    class="flex-1"
                  >
                    View
                  </UButton>
                  <UDropdownMenu :items="getDropdownMenuItems(file)">
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
          name="lucide:file"
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

interface FileItem {
  id: string;
  type?: "image" | "video" | "document" | "audio" | "archive" | "other" | null;
  displayName: string;
  icon: string;
  size?: string | null;
  modifiedAt: string;
  assetUrl?: string;
  mimetype: string;
}

interface Props {
  files: FileItem[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  isSelectionMode?: boolean;
  selectedItems?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyTitle: "No files",
  emptyDescription: "No files in this location",
  isSelectionMode: false,
  selectedItems: () => [],
});

// Transform files data for display
const transformedFiles = computed(() => {
  return props.files.map((file: any) => ({
    ...file,
    displayName: file.filename || file.title || "Untitled",
    icon: getFileIcon(file.mimetype, file.type),
    size: formatFileSize(parseInt(file.filesize || "0")),
    modifiedAt: file.updatedAt || file.createdAt || "",
    assetUrl: `/assets/${file.id}`,
    previewUrl: `/assets/${file.id}`,
  }));
});

// File utilities
function getFileIcon(mimetype: string, type: string): string {
  if (mimetype?.startsWith("image/")) return "lucide:image";
  if (mimetype?.startsWith("video/")) return "lucide:video";
  if (mimetype?.startsWith("audio/")) return "lucide:music";
  if (mimetype?.includes("pdf")) return "lucide:file-text";
  if (mimetype?.includes("zip") || mimetype?.includes("archive"))
    return "lucide:archive";
  if (mimetype?.startsWith("text/")) return "lucide:file-text";
  if (type === "document") return "lucide:file-text";
  return "lucide:file";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const emit = defineEmits<{
  "file-click": [file: any];
  "toggle-selection": [fileId: string];
  "refresh-files": [];
}>();
const { checkPermissionCondition } = usePermissions();
const { confirm } = useConfirm();
const toast = useToast();

// Check delete permission for files
const canDeleteFile = checkPermissionCondition({
  and: [
    {
      route: "/file_definition",
      actions: ["delete"],
    },
  ],
});

// Delete file API
const { execute: executeDeleteFile } = useApiLazy(() => `/file_definition`, {
  method: "delete",
  errorContext: "Delete File",
});

// Hover state for cards
const hoveredFileId = ref<string | null>(null);

// Inline editing state
const editingFileId = ref<string | null>(null);
const editingName = ref("");
const originalName = ref("");
const editingLoading = ref(false);

// File detail modal state
const showFileDetailModal = useState("file-detail-modal", () => false);
const selectedFile = useState<any>("file-selected", () => null);

function handleFileClick(file: any) {
  if (props.isSelectionMode) {
    toggleItemSelection(file.id);
  } else {
    emit("file-click", file);
  }
}

function toggleItemSelection(fileId: string) {
  emit("toggle-selection", fileId);
}

function viewFile(file: any) {
  if (file.assetUrl) {
    window.open(file.assetUrl, "_blank");
  }
}

// Show file detail function
// Delete file function
async function deleteFile(file: any) {
  const isConfirmed = await confirm({
    title: "Delete File",
    content: `Are you sure you want to delete "${
      file.filename || file.displayName
    }"? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (!isConfirmed) return;

  await executeDeleteFile({ id: file.id });

  toast.add({
    title: "Success",
    color: "success",
    description: "File deleted successfully!",
  });

  emit("refresh-files");
}

function showFileDetail(file: any) {
  selectedFile.value = file;
  showFileDetailModal.value = true;
}

// Inline rename functions
function startRename(file: any) {
  if (props.isSelectionMode) return;
  editingFileId.value = file.id;
  editingName.value = file.displayName;
  originalName.value = file.displayName;

  nextTick(() => {
    const input = document.querySelector(
      `input[data-editing-id="${file.id}"]`
    ) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function cancelEdit() {
  if (editingLoading.value) return;
  editingFileId.value = null;
  editingName.value = "";
  originalName.value = "";
  editingLoading.value = false;
}

async function saveEdit(file: any) {
  if (!editingName.value.trim()) {
    console.error("File name cannot be empty");
    return;
  }

  editingLoading.value = true;

  try {
    const { execute: updateFile, error } = useApiLazy(
      () => `file_definition/${file.id}`,
      {
        method: "patch",
        errorContext: "Update File",
      }
    );

    await updateFile({
      body: {
        filename: editingName.value.trim(),
        title: editingName.value.trim(),
      },
    });

    if (error.value) {
      editingLoading.value = false;
      return;
    }

    editingFileId.value = null;
    editingName.value = "";
    originalName.value = "";
    editingLoading.value = false;

    // Refresh the list
    emit("refresh-files");
  } catch (error) {
    editingLoading.value = false;
  }
}

// Check if file is an image using type field
function isImageFile(file: FileItem): boolean {
  return file?.type === "image";
}

// Get file color based on type
function getFileColor(file: FileItem): string {
  switch (file.type) {
    case "image":
      return "text-green-500 dark:text-green-400";
    case "video":
      return "text-purple-500 dark:text-purple-400";
    case "audio":
      return "text-orange-500 dark:text-orange-400";
    case "document":
      return "text-red-500 dark:text-red-400";
    case "archive":
      return "text-yellow-500 dark:text-yellow-400";
    default:
      return "text-gray-500 dark:text-gray-400";
  }
}

// Handle image loading errors
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
}

// Get context menu items for files
function getContextMenuItems(file: any) {
  const menuItems: any = [
    [
      {
        label: "View",
        icon: "lucide:eye",
        onSelect: () => {
          viewFile(file);
        },
      },
      {
        label: "Rename",
        icon: "lucide:edit-3",
        onSelect: () => {
          startRename(file);
        },
      },
      {
        label: "Download",
        icon: "lucide:download",
        onSelect: () => {
          if (file.assetUrl) {
            const link = document.createElement("a");
            link.href = file.assetUrl;
            link.download = file.displayName;
            link.click();
          }
        },
      },
      {
        label: "Copy URL",
        icon: "lucide:copy",
        onSelect: async () => {
          if (file.assetUrl) {
            await navigator.clipboard.writeText(
              window.location.origin + file.assetUrl
            );
            console.log("URL copied to clipboard");
          }
        },
      },
      {
        label: "Details",
        icon: "lucide:info",
        onSelect: () => {
          showFileDetail(file);
        },
      },
    ],
  ];

  // Only show delete option if user has permission
  if (canDeleteFile) {
    menuItems.push([
      {
        label: "Delete",
        icon: "lucide:trash-2",
        color: "error" as const,
        onSelect: () => {
          deleteFile(file);
        },
      },
    ]);
  }

  return menuItems;
}

// Get dropdown menu items (flat array)
function getDropdownMenuItems(file: any) {
  const menuItems: any = [
    {
      label: "View",
      icon: "lucide:eye",
      onSelect: () => {
        viewFile(file);
      },
    },
    {
      label: "Rename",
      icon: "lucide:edit-3",
      onSelect: () => {
        startRename(file);
      },
    },
    {
      label: "Download",
      icon: "lucide:download",
      onSelect: () => {
        if (file.assetUrl) {
          const link = document.createElement("a");
          link.href = file.assetUrl;
          link.download = file.displayName;
          link.click();
        }
      },
    },
    {
      label: "Copy URL",
      icon: "lucide:copy",
      onSelect: async () => {
        if (file.assetUrl) {
          await navigator.clipboard.writeText(
            window.location.origin + file.assetUrl
          );
          console.log("URL copied to clipboard");
        }
      },
    },
    {
      label: "Details",
      icon: "lucide:info",
      onSelect: () => {
        showFileDetail(file);
      },
    },
  ];

  // Only show delete option if user has permission
  if (canDeleteFile) {
    menuItems.push({
      label: "Delete",
      icon: "lucide:trash-2",
      color: "error" as const,
      onSelect: () => {
        deleteFile(file);
      },
    });
  }

  return menuItems;
}
</script>
