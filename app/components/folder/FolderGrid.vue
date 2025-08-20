<template>
  <div class="space-y-4">
    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <TransitionGroup name="scale">
        <div
          v-for="folder in folders"
          :key="folder.id"
          class="group relative"
          @mouseenter="hoveredFolderId = folder.id"
          @mouseleave="hoveredFolderId = null"
        >
          <!-- Card Container with Context Menu -->
          <UContextMenu :items="getContextMenuItems(folder)">
            <div
              class="relative bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
              :class="[
                selectedItems.includes(folder.id)
                  ? 'border-primary-500 shadow-lg shadow-primary-500/20 scale-[1.02]'
                  : hoveredFolderId === folder.id
                  ? 'border-primary-300 dark:border-primary-600 shadow-xl transform -translate-y-1'
                  : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg',
              ]"
              @click="handleFolderClick(folder)"
            >
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
              <div class="relative h-32 p-6 flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
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
                    <UIcon name="lucide:folder" class="w-3 h-3" />
                    <span>{{ folder.fileCount || 0 }} items</span>
                  </div>
                </div>

                <!-- Quick Actions (visible on hover) -->
                <div class="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <UButton
                    icon="lucide:folder-open"
                    size="xs"
                    variant="soft"
                    color="primary"
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
      </TransitionGroup>
    </div>

    <!-- List View -->
    <div v-else-if="viewMode === 'list'" class="space-y-1">
      <div
        v-for="folder in folders"
        :key="folder.id"
        class="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
        :class="{
          'bg-primary/10 border border-primary/30': isSelectionMode && selectedItems.includes(folder.id)
        }"
        @click="handleFolderClick(folder)"
      >
        <!-- Selection checkbox -->
        <div v-if="isSelectionMode" class="flex-shrink-0">
          <UCheckbox
            :checked="selectedItems.includes(folder.id)"
            @click.stop
            @change="toggleItemSelection(folder.id)"
          />
        </div>

        <!-- Folder Icon -->
        <div class="flex-shrink-0">
          <UIcon
            :name="getFolderIcon(folder).name"
            class="w-5 h-5"
            :class="getFolderIcon(folder).color"
          />
        </div>

        <!-- Name -->
        <div class="flex-1 min-w-0">
          <p class="font-medium truncate">{{ folder.name }}</p>
        </div>

        <!-- Items count -->
        <div class="flex-shrink-0 text-right w-20">
          <p class="text-sm text-muted-foreground">
            {{ folder.fileCount || 0 }} items
          </p>
        </div>

        <!-- Modified date -->
        <div class="flex-shrink-0 text-right w-32">
          <p class="text-sm text-muted-foreground">
            {{ formatDate(folder.updatedAt) }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <UDropdownMenu :items="getDropdownMenuItems(folder)">
            <UButton
              icon="lucide:more-horizontal"
              variant="ghost"
              size="sm"
              @click.stop
            />
          </UDropdownMenu>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="folders.length === 0 && !loading" class="text-center py-12">
      <UIcon name="lucide:folder" class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <p class="text-lg font-medium text-muted-foreground">{{ emptyTitle }}</p>
      <p class="text-sm text-muted-foreground mt-1">{{ emptyDescription }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/common/filter/filter-helpers';

interface Props {
  folders: any[];
  viewMode: 'grid' | 'list';
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  isSelectionMode?: boolean;
  selectedItems?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyTitle: "No folders",
  emptyDescription: "No folders in this location",
  isSelectionMode: false,
  selectedItems: () => [],
});

const emit = defineEmits<{
  'folder-click': [folder: any];
  'toggle-selection': [folderId: string];
  'refresh-folders': [];
}>();

// Hover state for cards
const hoveredFolderId = ref<string | null>(null);

// Inline editing state
const editingFolderId = ref<string | null>(null);
const editingName = ref('');
const originalName = ref('');
const editingLoading = ref(false);

// Import folder management for folder details
const { showFolderDetail } = useFolderManagement();

function handleFolderClick(folder: any) {
  if (props.isSelectionMode) {
    toggleItemSelection(folder.id);
  } else {
    emit('folder-click', folder);
  }
}

function toggleItemSelection(folderId: string) {
  emit('toggle-selection', folderId);
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
    console.error('Folder name cannot be empty');
    return;
  }

  editingLoading.value = true;

  try {
    const { execute: updateFolder, error } = useApiLazy(
      () => `folder_definition/${folder.id}`,
      {
        method: "patch",
        errorContext: "Update Folder",
      }
    );

    await updateFolder({ body: { name: editingName.value.trim() } });

    if (error.value) {
      editingLoading.value = false;
      return;
    }

    console.log('Folder updated successfully');

    editingFolderId.value = null;
    editingName.value = '';
    originalName.value = '';
    editingLoading.value = false;
    
    // Refresh the list
    emit('refresh-folders');
    
  } catch (error) {
    console.error('Error updating folder:', error);
    editingLoading.value = false;
  }
}

// Get context menu items for folders
function getContextMenuItems(folder: any) {
  return [
    [{
      label: 'Open',
      icon: 'lucide:folder-open',
      onSelect: () => {
        emit('folder-click', folder);
      },
    }],
    [{
      label: 'Rename',
      icon: 'lucide:edit-3',
      onSelect: () => {
        startRename(folder);
      },
    }],
    [{
      label: 'Details',
      icon: 'lucide:info',
      onSelect: () => {
        showDetail(folder);
      },
    }],
    [{
      label: 'Delete',
      icon: 'lucide:trash-2',
      class: 'text-red-500',
      onSelect: () => {
        console.log('Delete folder:', folder);
      },
    }],
  ];
}

// Get dropdown menu items (flat array)
function getDropdownMenuItems(folder: any) {
  return [
    {
      label: 'Open',
      icon: 'lucide:folder-open',
      onSelect: () => {
        emit('folder-click', folder);
      },
    },
    {
      label: 'Rename',
      icon: 'lucide:edit-3',
      onSelect: () => {
        startRename(folder);
      },
    },
    {
      label: 'Details',
      icon: 'lucide:info',
      onSelect: () => {
        showDetail(folder);
      },
    },
    {
      label: 'Delete',
      icon: 'lucide:trash-2',
      class: 'text-red-500',
      onSelect: () => {
        console.log('Delete folder:', folder);
      },
    },
  ];
}

// Get folder icon with color
function getFolderIcon(folder: any) {
  if (folder.isSystem) {
    return {
      name: folder.icon || 'lucide:shield',
      color: 'text-amber-500 dark:text-amber-400',
    };
  }
  
  return {
    name: folder.icon || 'lucide:folder',
    color: 'text-blue-500 dark:text-blue-400',
  };
}
</script>

<style>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>