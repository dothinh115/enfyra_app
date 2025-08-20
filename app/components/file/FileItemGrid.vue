<template>
  <div class="space-y-4">
    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <TransitionGroup name="scale">
        <div
          v-for="item in items"
          :key="item.id"
          class="group relative"
          @mouseenter="hoveredItemId = item.id"
          @mouseleave="hoveredItemId = null"
        >
          <!-- Card Container with Context Menu -->
          <UContextMenu :items="getContextMenuItems(item)">
            <div
              class="relative bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
              :class="[
                selectedItems.includes(item.id)
                  ? 'border-primary-500 shadow-lg shadow-primary-500/20 scale-[1.02]'
                  : hoveredItemId === item.id
                  ? 'border-primary-300 dark:border-primary-600 shadow-xl transform -translate-y-1'
                  : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg',
              ]"
              @click="handleItemClick(item)"
            >
            <!-- Selection Checkbox -->
            <div
              v-if="isSelectionMode"
              class="absolute top-3 right-3 z-20 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md"
              @click.stop
            >
              <UCheckbox
                :model-value="selectedItems.includes(item.id)"
                @update:model-value="() => toggleItemSelection(item.id)"
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
                item.itemType === 'folder'
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
                  : item.type === 'image'
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                  : 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20'
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

              <!-- Image preview for image files -->
              <div 
                v-if="item.itemType === 'file' && isImageFile(item)"
                class="relative w-20 h-20 rounded-lg overflow-hidden bg-white dark:bg-gray-700 shadow-lg"
              >
                <img 
                  :src="item.assetUrl" 
                  :alt="item.displayName"
                  class="w-full h-full object-cover"
                  loading="lazy"
                  @error="handleImageError"
                />
              </div>
              
              <!-- Icon for other items -->
              <div v-else class="flex justify-center items-center p-4">
                <UIcon
                  :name="item.icon"
                  :size="96"
                  class="transition-all duration-300"
                  :class="[
                    getItemColor(item),
                    hoveredItemId === item.id ? 'scale-110 rotate-3' : ''
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
              <!-- Item Name -->
              <div class="flex items-start justify-between gap-2">
                <!-- Inline Edit Mode -->
                <div v-if="editingItemId === item.id" class="flex items-center gap-1 flex-1">
                  <input
                    v-model="editingName"
                    @keyup.enter="!editingLoading && saveEdit(item)"
                    @keyup.escape="!editingLoading && cancelEdit()"
                    :disabled="editingLoading"
                    :data-editing-id="item.id"
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
                      @click.stop="saveEdit(item)"
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
                    :title="item.displayName"
                    @dblclick="startRename(item)"
                  >
                    {{ item.displayName }}
                  </h3>
                  <UButton
                    icon="lucide:edit-3"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    @click.stop="startRename(item)"
                    class="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  />
                </div>
              </div>

              <!-- Item Stats -->
              <div class="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <div class="flex items-center gap-1">
                  <UIcon name="lucide:calendar" class="w-3 h-3" />
                  <span>{{ formatDate(item.modifiedAt) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <UIcon :name="item.itemType === 'file' ? 'lucide:file' : 'lucide:folder'" class="w-3 h-3" />
                  <span v-if="item.itemType === 'file' && item.size">{{ item.size }}</span>
                  <span v-else-if="item.itemType === 'folder' && item.children?.length">{{ item.children.length }} items</span>
                  <span v-else>{{ item.itemType }}</span>
                </div>
              </div>

              <!-- Quick Actions (visible on hover) -->
              <div 
                class="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <UButton
                  :icon="item.itemType === 'folder' ? 'lucide:folder-open' : 'lucide:eye'"
                  size="xs"
                  variant="soft"
                  color="primary"
                  @click.stop="handleItemClick(item)"
                  class="flex-1"
                >
                  {{ item.itemType === 'folder' ? 'Open' : 'View' }}
                </UButton>
                <UDropdownMenu :items="getDropdownMenuItems(item)">
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
        v-for="item in items"
        :key="item.id"
        class="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
        :class="{
          'bg-primary/10 border border-primary/30': isSelectionMode && selectedItems.includes(item.id)
        }"
        @click="handleItemClick(item)"
      >
        <!-- Selection checkbox -->
        <div v-if="isSelectionMode" class="flex-shrink-0">
          <UCheckbox
            :checked="selectedItems.includes(item.id)"
            @click.stop
            @change="toggleItemSelection(item.id)"
          />
        </div>

        <!-- Icon or Image Preview -->
        <div class="flex-shrink-0">
          <!-- Image preview for image files -->
          <div 
            v-if="item.itemType === 'file' && isImageFile(item)"
            class="relative w-8 h-8 rounded overflow-hidden bg-muted"
          >
            <img 
              :src="item.assetUrl" 
              :alt="item.displayName"
              class="w-full h-full object-cover"
              loading="lazy"
              @error="handleImageError"
            />
          </div>
          
          <!-- Regular icon for other items -->
          <UIcon
            v-else
            :name="item.icon"
            class="w-5 h-5 text-primary"
          />
        </div>

        <!-- Name -->
        <div class="flex-1 min-w-0">
          <p class="font-medium truncate">{{ item.displayName }}</p>
        </div>

        <!-- Size -->
        <div v-if="item.itemType === 'file'" class="flex-shrink-0 text-right w-20">
          <p class="text-sm text-muted-foreground">{{ item.size || '-' }}</p>
        </div>
        <div v-else class="flex-shrink-0 text-right w-20">
          <p class="text-sm text-muted-foreground">
            {{ item.children?.length || 0 }} items
          </p>
        </div>

        <!-- Modified date -->
        <div class="flex-shrink-0 text-right w-32">
          <p class="text-sm text-muted-foreground">
            {{ formatDate(item.modifiedAt) }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <UDropdownMenu :items="getDropdownMenuItems(item)">
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
    <div v-if="items.length === 0 && !loading" class="text-center py-12">
      <UIcon name="lucide:folder-open" class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <p class="text-lg font-medium text-muted-foreground">{{ emptyTitle }}</p>
      <p class="text-sm text-muted-foreground mt-1">{{ emptyDescription }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/common/filter/filter-helpers';

interface FileItem {
  id: string;
  itemType: 'file' | 'folder';
  type?: 'image' | 'video' | 'document' | 'audio' | 'archive' | 'other' | null;
  displayName: string;
  icon: string;
  size?: string | null;
  modifiedAt: string;
  assetUrl?: string;
  children?: any[];
}

interface Props {
  items: FileItem[];
  viewMode: 'grid' | 'list';
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  isSelectionMode?: boolean;
  selectedItems?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyTitle: "No items yet",
  emptyDescription: "This folder is empty",
  isSelectionMode: false,
  selectedItems: () => [],
});

const emit = defineEmits<{
  'item-click': [item: any];
  'toggle-selection': [itemId: string];
  'show-menu': [item: any, event: Event];
  'refresh-items': [];
}>();

// Hover state for cards
const hoveredItemId = ref<string | null>(null);

// Inline editing state
const editingItemId = ref<string | null>(null);
const editingName = ref('');
const originalName = ref('');
const editingLoading = ref(false);

// Import folder management for folder details
const { showFolderDetail } = useFolderManagement();

// File detail modal state
const showFileDetailModal = useState('file-detail-modal', () => false);
const selectedFile = useState<any>('file-selected', () => null);

function handleItemClick(item: any) {
  if (props.isSelectionMode) {
    toggleItemSelection(item.id);
  } else {
    emit('item-click', item);
  }
}


function toggleItemSelection(itemId: string) {
  emit('toggle-selection', itemId);
}

function showItemMenu(item: any, event: Event) {
  emit('show-menu', item, event);
}

// Show item detail function
function showItemDetail(item: any) {
  if (item.itemType === 'folder') {
    showFolderDetail(item);
  } else {
    selectedFile.value = item;
    showFileDetailModal.value = true;
  }
}

// Inline rename functions
function startRename(item: any) {
  if (props.isSelectionMode) return;
  editingItemId.value = item.id;
  editingName.value = item.itemType === 'folder' ? item.name : item.displayName;
  originalName.value = item.itemType === 'folder' ? item.name : item.displayName;
  
  nextTick(() => {
    const input = document.querySelector(`input[data-editing-id="${item.id}"]`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function cancelEdit() {
  if (editingLoading.value) return;
  editingItemId.value = null;
  editingName.value = '';
  originalName.value = '';
  editingLoading.value = false;
}

async function saveEdit(item: any) {
  if (!editingName.value.trim()) {
    // TODO: Add toast notification
    console.error('Name cannot be empty');
    return;
  }

  editingLoading.value = true;

  try {
    if (item.itemType === 'folder') {
      // Update folder
      const { execute: updateFolder, error } = useApiLazy(
        () => `folder_definition/${item.id}`,
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
    } else {
      // Update file
      const { execute: updateFile, error } = useApiLazy(
        () => `file_definition/${item.id}`,
        {
          method: "patch",
          errorContext: "Update File",
        }
      );

      await updateFile({ body: { 
        filename: editingName.value.trim(),
        title: editingName.value.trim()
      } });

      if (error.value) {
        editingLoading.value = false;
        return;
      }
    }

    // TODO: Add success toast
    console.log('Updated successfully');

    editingItemId.value = null;
    editingName.value = '';
    originalName.value = '';
    editingLoading.value = false;
    
    // Refresh the list
    emit('refresh-items');
    
  } catch (error) {
    console.error('Error updating item:', error);
    editingLoading.value = false;
  }
}


// Get context menu items for files and folders
function getContextMenuItems(item: any) {
  const menuItems = [];
  
  if (item.itemType === 'folder') {
    // Folder menu items
    menuItems.push([{
      label: 'Open',
      icon: 'lucide:folder-open',
      onSelect: () => {
        handleItemClick(item);
      },
    }]);
    
    menuItems.push([{
      label: 'Rename',
      icon: 'lucide:edit-3',
      onSelect: () => {
        startRename(item);
      },
    }]);
    
    menuItems.push([{
      label: 'Details',
      icon: 'lucide:info',
      onSelect: () => {
        showItemDetail(item);
      },
    }]);
    
    menuItems.push([{
      label: 'Delete',
      icon: 'lucide:trash-2',
      class: 'text-red-500',
      onSelect: () => {
        console.log('Delete folder:', item);
        // TODO: Implement single folder delete
      },
    }]);
    
  } else {
    // File menu items
    menuItems.push([{
      label: 'View',
      icon: 'lucide:eye',
      onSelect: () => {
        if (item.assetUrl) {
          window.open(item.assetUrl, '_blank');
        }
      },
    }]);
    
    menuItems.push([{
      label: 'Rename',
      icon: 'lucide:edit-3',
      onSelect: () => {
        startRename(item);
      },
    }]);
    
    menuItems.push([{
      label: 'Download',
      icon: 'lucide:download',
      onSelect: () => {
        if (item.assetUrl) {
          const link = document.createElement('a');
          link.href = item.assetUrl;
          link.download = item.displayName;
          link.click();
        }
      },
    }]);
    
    menuItems.push([{
      label: 'Copy URL',
      icon: 'lucide:copy',
      onSelect: async () => {
        if (item.assetUrl) {
          await navigator.clipboard.writeText(window.location.origin + item.assetUrl);
          // TODO: Show toast notification
          console.log('URL copied to clipboard');
        }
      },
    }]);
    
    menuItems.push([{
      label: 'Details',
      icon: 'lucide:info',
      onSelect: () => {
        showItemDetail(item);
      },
    }]);
    
    menuItems.push([{
      label: 'Delete',
      icon: 'lucide:trash-2',
      class: 'text-red-500',
      onSelect: () => {
        console.log('Delete file:', item);
        // TODO: Implement single file delete
      },
    }]);
  }
  
  return menuItems;
}

// Get dropdown menu items (flat array for UDropdownMenu) - same as context menu
function getDropdownMenuItems(item: any) {
  const menuItems = [];
  
  if (item.itemType === 'folder') {
    // Folder menu items
    menuItems.push({
      label: 'Open',
      icon: 'lucide:folder-open',
      onSelect: () => {
        handleItemClick(item);
      },
    });
    
    menuItems.push({
      label: 'Rename',
      icon: 'lucide:edit-3',
      onSelect: () => {
        startRename(item);
      },
    });
    
    menuItems.push({
      label: 'Details',
      icon: 'lucide:info',
      onSelect: () => {
        showItemDetail(item);
      },
    });
    
    menuItems.push({
      label: 'Delete',
      icon: 'lucide:trash-2',
      class: 'text-red-500',
      onSelect: () => {
        console.log('Delete folder:', item);
        // TODO: Implement single folder delete
      },
    });
    
  } else {
    // File menu items
    menuItems.push({
      label: 'View',
      icon: 'lucide:eye',
      onSelect: () => {
        if (item.assetUrl) {
          window.open(item.assetUrl, '_blank');
        }
      },
    });
    
    menuItems.push({
      label: 'Rename',
      icon: 'lucide:edit-3',
      onSelect: () => {
        startRename(item);
      },
    });
    
    menuItems.push({
      label: 'Download',
      icon: 'lucide:download',
      onSelect: () => {
        if (item.assetUrl) {
          const link = document.createElement('a');
          link.href = item.assetUrl;
          link.download = item.displayName;
          link.click();
        }
      },
    });
    
    menuItems.push({
      label: 'Copy URL',
      icon: 'lucide:copy',
      onSelect: async () => {
        if (item.assetUrl) {
          await navigator.clipboard.writeText(window.location.origin + item.assetUrl);
          // TODO: Show toast notification
          console.log('URL copied to clipboard');
        }
      },
    });
    
    menuItems.push({
      label: 'Details',
      icon: 'lucide:info',
      onSelect: () => {
        showItemDetail(item);
      },
    });
    
    menuItems.push({
      label: 'Delete',
      icon: 'lucide:trash-2',
      class: 'text-red-500',
      onSelect: () => {
        console.log('Delete file:', item);
        // TODO: Implement single file delete
      },
    });
  }
  
  return menuItems;
}

// Check if file is an image using type field
function isImageFile(item: FileItem): boolean {
  return item?.type === 'image';
}

// Get item color based on type
function getItemColor(item: FileItem): string {
  if (item.itemType === 'folder') {
    return 'text-blue-500 dark:text-blue-400';
  }
  
  switch (item.type) {
    case 'image':
      return 'text-green-500 dark:text-green-400';
    case 'video':
      return 'text-purple-500 dark:text-purple-400';
    case 'audio':
      return 'text-orange-500 dark:text-orange-400';
    case 'document':
      return 'text-red-500 dark:text-red-400';
    case 'archive':
      return 'text-yellow-500 dark:text-yellow-400';
    default:
      return 'text-gray-500 dark:text-gray-400';
  }
}

// Handle image loading errors
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  // Could show broken image icon or fallback
}
</script>

