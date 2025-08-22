<script setup lang="ts">
import { UIcon } from "#components";
import { h } from "vue";

interface Props {
  folders: any[];
  viewMode: "grid" | "list";
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
  "folder-click": [folder: any];
  "toggle-selection": [folderId: string];
  "refresh-folders": [];
}>();

const { isMounted } = useMounted();

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

// Data table columns for list view
const { buildColumn, buildActionsColumn } = useDataTableColumns();

// Folder actions
function showFolderDetail(folder: any) {
  const { showFolderDetail } = useFileManager();
  showFolderDetail(folder);
}

function deleteFolder(folder: any) {
  const { deleteFolder } = useFileManager();
  deleteFolder(folder, () => emit("refresh-folders"));
}

// Build folder columns for DataTable
const folderColumns = computed(() => [
  buildColumn({
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      const folder = row.original;
      return h("div", { class: "flex items-center gap-3" }, [
        h(
          "div",
          {
            class:
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100 dark:bg-blue-900/30",
          },
          [
            h(UIcon, {
              name: folder.icon || "lucide:folder",
              class: "w-4 h-4 text-blue-600 dark:text-blue-400",
            }),
          ]
        ),
        h("div", { class: "min-w-0 flex-1" }, [
          h(
            "p",
            { class: "font-medium text-gray-900 dark:text-white truncate" },
            folder.name
          ),
        ]),
      ]);
    },
  }),
  buildColumn({
    id: "updatedAt",
    header: "Modified",
    format: "datetime",
  }),
  buildColumn({
    id: "fileCount",
    header: "Items",
    cell: ({ getValue }) => (getValue() as number) || 0,
  }),
  buildActionsColumn({
    width: 60,
    actions: [
      {
        label: "Open",
        icon: "i-lucide-folder-open",
        onSelect: (folder) => emit("folder-click", folder),
      },
      {
        label: "Details",
        icon: "i-lucide-info",
        onSelect: (folder) => showFolderDetail(folder),
      },
      // Only show delete action if user has permission
      ...(canDeleteFolder
        ? [
            {
              label: "Delete",
              icon: "i-lucide-trash-2",
              color: "error" as const,
              onSelect: (folder: any) => deleteFolder(folder),
            },
          ]
        : []),
    ],
  }),
]);

function handleFolderClick(folder: any) {
  emit("folder-click", folder);
}

function toggleItemSelection(folderId: string) {
  emit("toggle-selection", folderId);
}
</script>

<template>
  <div>
    <Transition name="loading-fade" mode="out-in">
      <!-- Loading State - chỉ hiển thị khi loading và chưa có data -->
      <div
        v-if="(loading && folders.length === 0) || !isMounted"
        class="col-span-full"
      >
        <CommonLoadingState type="folder" />
      </div>

      <!-- Content - hiển thị ngay khi có data, không cần đợi isMounted -->
      <div v-else-if="folders.length > 0" key="content">
        <!-- Grid View -->
        <FolderGrid
          v-if="viewMode === 'grid'"
          :folders="folders"
          :empty-title="emptyTitle"
          :empty-description="emptyDescription"
          :is-selection-mode="isSelectionMode"
          :selected-items="selectedItems"
          @folder-click="handleFolderClick"
          @toggle-selection="toggleItemSelection"
          @refresh-folders="() => emit('refresh-folders')"
        />

        <!-- List View -->
        <DataTable
          v-else-if="viewMode === 'list'"
          :data="folders"
          :columns="folderColumns"
          :loading="false"
          :page-size="50"
          :selectable="true"
          @row-click="handleFolderClick"
        />
      </div>

      <!-- Empty State - chỉ hiển thị khi không loading, không có data và đã mount -->
      <div
        v-else-if="!loading && folders.length === 0"
        key="empty"
        class="text-center py-12"
      >
        <UIcon
          name="lucide:folder"
          class="w-16 h-16 text-muted-foreground mx-auto mb-4"
        />
        <p class="text-lg font-medium text-muted-foreground">
          {{ emptyTitle }}
        </p>
        <p class="text-sm text-muted-foreground mt-1">{{ emptyDescription }}</p>
      </div>
    </Transition>
  </div>
</template>
