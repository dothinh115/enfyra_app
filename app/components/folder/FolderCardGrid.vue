<script setup lang="ts">
interface Props {
  folders: any[];
  viewMode: 'grid' | 'list';
}

const props = defineProps<Props>();
const emit = defineEmits<{
  refreshFolders: [];
  folderCreated: [];
}>();

const router = useRouter();
const toast = useToast();

// Folder management composable (không cần modal state vì modal ở main page)
const {
  selectedFolders,
  isSelectionMode,
  toggleFolderSelection,
  toggleSelectAll,
  deleteSelectedFolders,
  showFolderDetail,
  deleteFolder,
} = useFolderManagement();

// Hover state for cards
const hoveredFolderId = ref<string | null>(null);

// Inline editing state
const editingFolderId = ref<string | null>(null);
const editingName = ref('');
const originalName = ref('');
const editingLoading = ref(false);

// Refresh folders
const refreshFolders = () => {
  emit('refreshFolders');
};


// Navigation
function navigateToFolder(folder: any) {
  if (!isSelectionMode.value) {
    router.push(`/files/folders/${folder.id}`);
  } else {
    toggleFolderSelection(folder.id);
  }
}

// Context menu actions - extend the composable's menu
function getContextMenuItems(folder: any) {
  // Get base items from composable (Details, Delete)
  const baseItems = useFolderManagement().getContextMenuItems(folder, refreshFolders);
  
  // Add Open and Rename items
  const additionalItems = [
    [{
      label: 'Open',
      icon: 'i-heroicons-folder-open',
      onSelect: () => {
        navigateToFolder(folder);
      },
    }],
    [{
      label: 'Rename',
      icon: 'i-heroicons-pencil',
      onSelect: () => {
        startRename(folder);
      },
    }],
  ];
  
  // Combine: Open, Rename, Details, Delete
  return [...additionalItems, ...baseItems];
}

// Dropdown menu items (flat array for UDropdownMenu) - same as context menu
function getDropdownItems(folder: any) {
  return [
    {
      label: 'Open',
      icon: 'i-lucide-folder-open',
      onSelect: () => {
        navigateToFolder(folder);
      },
    },
    {
      label: 'Rename',
      icon: 'i-lucide-edit-3',
      onSelect: () => {
        startRename(folder);
      },
    },
    {
      label: 'Details', 
      icon: 'i-lucide-info',
      onSelect: () => {
        console.log('Grid Details clicked for:', folder.name);
        showFolderDetail(folder);
      },
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash-2',
      class: 'text-red-500',
      onSelect: () => {
        deleteFolder(folder, refreshFolders);
      },
    },
  ];
}


// Removed local deleteFolder function - using composable instead

function startRename(folder: any) {
  if (isSelectionMode.value) return;
  editingFolderId.value = folder.id;
  editingName.value = folder.name;
  originalName.value = folder.name;
  
  nextTick(() => {
    const input = document.querySelector(`input[data-editing-id="${folder.id}"]`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function cancelEdit() {
  if (editingLoading.value) return;
  editingFolderId.value = null;
  editingName.value = '';
  originalName.value = '';
  editingLoading.value = false;
}

async function saveEdit(folder: any) {
  if (!editingName.value.trim()) {
    toast.add({
      title: "Error",
      description: "Folder name cannot be empty",
      color: "error",
    });
    return;
  }

  editingLoading.value = true;

  const { execute: updateFolder, error: updateError } = useApiLazy(
    () => `folder_definition/${folder.id}`,
    {
      method: "patch",
      errorContext: "Update Folder",
    }
  );

  await updateFolder({ body: { name: editingName.value.trim() } });

  if (updateError.value) {
    editingLoading.value = false;
    return;
  }

  toast.add({
    title: "Success",
    description: "Folder name updated successfully!",
    color: "success",
  });

  editingFolderId.value = null;
  editingName.value = '';
  originalName.value = '';
  editingLoading.value = false;
  refreshFolders();
}

// Removed showDetails function - using showFolderDetail from composable

// Get folder icon with color
function getFolderIcon(folder: any) {
  if (folder.isSystem) {
    return {
      name: folder.icon || 'lucide:shield',
      color: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    };
  }
  
  return {
    name: folder.icon || 'lucide:folder',
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  };
}

// Format date
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <TransitionGroup name="scale">
      <div
        v-for="folder in props.folders"
        :key="folder.id"
        class="group relative"
        @mouseenter="hoveredFolderId = folder.id"
        @mouseleave="hoveredFolderId = null"
      >
        <!-- Card Container -->
        <UContextMenu :items="getContextMenuItems(folder)">
          <div
            class="relative bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
            :class="[
              selectedFolders.includes(folder.id)
                ? 'border-primary-500 shadow-lg shadow-primary-500/20 scale-[1.02]'
                : hoveredFolderId === folder.id
                ? 'border-primary-300 dark:border-primary-600 shadow-xl transform -translate-y-1'
                : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg',
            ]"
            @click="navigateToFolder(folder)"
          >
            <!-- Selection Checkbox -->
            <div
              v-if="isSelectionMode"
              class="absolute top-3 right-3 z-20 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md"
              @click.stop
            >
              <UCheckbox
                :model-value="selectedFolders.includes(folder.id)"
                @update:model-value="() => toggleFolderSelection(folder.id)"
                size="lg"
                :ui="{
                  wrapper: 'flex items-center',
                  base: 'rounded-lg',
                }"
              />
            </div>

            <!-- Card Header with Gradient -->
            <div 
              class="relative h-32 p-6 flex items-center justify-center overflow-hidden"
              :class="[
                folder.isSystem
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
              ]"
            >
              <!-- Background Pattern -->
              <div class="absolute inset-0 opacity-10">
                <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
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
                    hoveredFolderId === folder.id ? 'scale-110 rotate-3' : ''
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
              <!-- Folder Name -->
              <div class="flex items-start justify-between gap-2">
                <!-- Inline Edit Mode -->
                <div v-if="editingFolderId === folder.id" class="flex items-center gap-1 flex-1">
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
                <div v-else class="flex items-center justify-between gap-2 flex-1">
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
                    class="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
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
              <div class="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <div class="flex items-center gap-1">
                  <UIcon name="lucide:calendar" class="w-3 h-3" />
                  <span>{{ formatDate(folder.createdAt) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="lucide:files" class="w-3 h-3" />
                  <span>{{ folder.fileCount || 0 }} files</span>
                </div>
              </div>

              <!-- Quick Actions (visible on hover) -->
              <div 
                class="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <UButton
                  icon="lucide:folder-open"
                  size="xs"
                  variant="soft"
                  color="primary"
                  @click.stop="navigateToFolder(folder)"
                  class="flex-1"
                >
                  Open
                </UButton>
                <UDropdownMenu
                  :items="getDropdownItems(folder)"
                >
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
    </TransitionGroup>
  </div>

</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>