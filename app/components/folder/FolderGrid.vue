<script setup lang="ts">
interface Props {
  emptyTitle: string;
  emptyDescription: string;
  folders: any;
  showCreateModal?: boolean;
  parentId?: string;
}

const emit = defineEmits<{
  "update:showCreateModal": [value: boolean];
  folderCreated: [];
  refreshFolders: [];
}>();

const props = defineProps<Props>();

// No need for isMounted here - handled by parent page

// Use shared folder management logic without API calls
const {
  showDetailModal,
  selectedFolder,
  selectedFolders,
  isSelectionMode,
  toggleFolderSelection,
  toggleSelectAll,
  getContextMenuItems,
  deleteSelectedFolders,
} = useFolderManagement();

// Inline editing state
const editingFolderId = ref<string | null>(null);
const editingName = ref('');
const toast = useToast();

// Refresh folders by emitting event to parent
const refreshFolders = () => {
  emit("refreshFolders");
};

// Create modal computed
const showCreateModalComputed = computed({
  get: () => props.showCreateModal || false,
  set: (value) => emit("update:showCreateModal", value),
});

// Register actions with computed refs for reactive values
useSubHeaderActionRegistry([
  {
    id: "delete-selected",
    label: computed(() => `Delete (${selectedFolders.value.length})`),
    icon: "lucide:trash",
    color: "error" as const,
    onClick: async () => {
      const folderData = props.folders || [];
      await deleteSelectedFolders(folderData, refreshFolders);
    },
    side: "right" as const,
    show: computed(
      () => isSelectionMode.value && selectedFolders.value.length > 0
    ),
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
      const folderData = props.folders || [];
      toggleSelectAll(totalCount, folderData);
    },
    side: "right" as const,
    show: computed(() => isSelectionMode.value),
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
    show: true,
  },
]);

// Handle folder created
function handleFolderCreated() {
  refreshFolders();
  emit("folderCreated");
}

// Inline editing functions
function startEditName(folder: any) {
  if (isSelectionMode.value) return;
  editingFolderId.value = folder.id;
  editingName.value = folder.name;
  
  nextTick(() => {
    const input = document.querySelector(`input[ref="editInput"]`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function cancelEdit() {
  editingFolderId.value = null;
  editingName.value = '';
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

  const { execute: updateFolder, error: updateError } = useApiLazy(
    () => `folder_definition/${folder.id}`,
    {
      method: "patch",
      errorContext: "Update Folder",
    }
  );

  await updateFolder({ body: { name: editingName.value.trim() } });

  if (updateError.value) {
    return;
  }

  toast.add({
    title: "Success",
    description: "Folder name updated successfully!",
    color: "success",
  });

  editingFolderId.value = null;
  editingName.value = '';
  refreshFolders();
}
</script>

<template>
  <div class="space-y-6">
    <!-- Content -->
    <div
      v-if="props.folders?.length > 0"
      class="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8"
    >
      <UContextMenu
        v-for="folder in props.folders"
        :key="folder.id"
        :items="getContextMenuItems(folder, refreshFolders)"
      >
        <div
          class="group flex flex-col items-center cursor-pointer relative p-2 rounded-lg transition-colors"
          :class="{
            'bg-primary/10': selectedFolders.includes(folder.id),
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
          <div 
            class="relative p-1 rounded-lg group-hover:bg-white/20 group-hover:shadow-lg transition-all"
            @click="
              () => {
                if (isSelectionMode) {
                  toggleFolderSelection(folder.id);
                } else {
                  navigateTo(`/files/folders/${folder.id}`);
                }
              }
            "
          >
            <UIcon
              :name="folder.icon || 'i-lucide-folder'"
              :size="120"
              class="text-sky-500 transition-colors"
              style="color: #5aaadb"
              :class="{
                'opacity-70':
                  isSelectionMode && !selectedFolders.includes(folder.id),
              }"
            />
          </div>

          <!-- Folder Name Below -->
          <div class="text-center w-full mt-2">
            <div v-if="editingFolderId === folder.id" class="flex items-center gap-1 justify-center">
              <input
                v-model="editingName"
                @keyup.enter="saveEdit(folder)"
                @keyup.escape="cancelEdit()"
                class="w-30 text-xs font-medium text-center bg-white dark:bg-gray-800 border border-primary rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 dark:text-gray-100"
                @click.stop
                ref="editInput"
              />
              <UButton
                icon="lucide:check"
                size="xs"
                color="success"
                variant="solid"
                @click.stop="saveEdit(folder)"
                class="!p-0.5 !min-w-[20px] !w-5 !h-5 flex items-center justify-center"
              />
              <UButton
                icon="lucide:x"
                size="xs"
                color="error"
                variant="solid"
                @click.stop="cancelEdit()"
                class="!p-0.5 !min-w-[20px] !w-5 !h-5 flex items-center justify-center"
              />
            </div>
            <div
              v-else
              class="flex items-center justify-center gap-1"
            >
              <p
                class="font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 truncate transition-colors"
                :class="{
                  'opacity-70':
                    isSelectionMode && !selectedFolders.includes(folder.id),
                }"
              >
                {{ folder.name }}
              </p>
              <UButton
                icon="lucide:edit-3"
                size="xs"
                variant="ghost"
                color="neutral"
                @click.stop="startEditName(folder)"
                class="opacity-30 group-hover:opacity-100 transition-opacity ml-1"
              />
            </div>
          </div>
        </div>
      </UContextMenu>
    </div>

    <CommonEmptyState
      v-else
      :title="emptyTitle"
      :description="emptyDescription"
      icon="lucide:folder-x"
      size="sm"
    />

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

    <!-- Create Folder Modal -->
    <FolderCreateModal
      v-model="showCreateModalComputed"
      :parent-id="props.parentId"
      @created="handleFolderCreated"
    />
  </div>
</template>
