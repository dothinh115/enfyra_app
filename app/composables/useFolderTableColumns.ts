import type { ColumnDef } from "@tanstack/vue-table";
import type { DataTableColumnConfig, DataTableActionsConfig } from "./useDataTableColumns";
import { UIcon, UButton } from "#components";

export function useFolderTableColumns() {
  const router = useRouter();
  const toast = useToast();
  const { buildColumn, buildActionsColumn } = useDataTableColumns();

  // Folder management composable
  const { showFolderDetail, deleteFolder } = useFolderManagement();

  // Inline editing state
  const editingFolderId = ref<string | null>(null);
  const editingName = ref('');
  const originalName = ref('');
  const editingLoading = ref(false);
  const currentOnRename = ref<((folderId: string, newName: string) => Promise<void>) | null>(null);

  // Inline editing functions
  function startRename(folder: any) {
    editingFolderId.value = folder.id;
    editingName.value = folder.name;
    originalName.value = folder.name;
  }

  function cancelEdit() {
    if (editingLoading.value) return;
    editingFolderId.value = null;
    editingName.value = '';
    originalName.value = '';
    editingLoading.value = false;
  }

  async function saveEdit(folder: any, onRename?: (folderId: string, newName: string) => Promise<void>) {
    if (!editingName.value.trim()) {
      toast.add({
        title: "Error",
        description: "Folder name cannot be empty",
        color: "error",
      });
      return;
    }

    editingLoading.value = true;

    try {
      if (onRename) {
        await onRename(folder.id, editingName.value.trim());
      }
      
      toast.add({
        title: "Success",
        description: "Folder name updated successfully!",
        color: "success",
      });

      editingFolderId.value = null;
      editingName.value = '';
      originalName.value = '';
    } catch (error) {
      // Error handling will be done by parent component
    } finally {
      editingLoading.value = false;
    }
  }

  // Build name cell with inline editing
  function buildNameCell(folder: any) {
    const isEditing = editingFolderId.value === folder.id;

    return h("div", { class: "flex items-center gap-3" }, [
      // Icon
      h(
        "div",
        {
          class: `w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            folder.isSystem
              ? "bg-amber-100 dark:bg-amber-900/30"
              : "bg-blue-100 dark:bg-blue-900/30"
          }`,
        },
        [
          h(UIcon, {
            name:
              folder.icon ||
              (folder.isSystem ? "lucide:shield" : "lucide:folder"),
            class: `w-5 h-5 ${
              folder.isSystem
                ? "text-amber-600 dark:text-amber-400"
                : "text-blue-600 dark:text-blue-400"
            }`,
          }),
        ]
      ),
      // Name and description
      h("div", { class: "min-w-0 flex-1" }, [
        h("div", { class: "flex items-center gap-2" }, [
          // Editing mode
          isEditing
            ? h("div", { class: "flex items-center gap-1 flex-1" }, [
                h("input", {
                  value: editingName.value,
                  onInput: (e: any) => (editingName.value = e.target.value),
                  onKeyup: (e: KeyboardEvent) => {
                    if (e.key === "Enter" && !editingLoading.value) {
                      saveEdit(folder, currentOnRename.value || undefined);
                    } else if (e.key === "Escape" && !editingLoading.value) {
                      cancelEdit();
                    }
                  },
                  disabled: editingLoading.value,
                  class: "flex-1 text-sm font-semibold bg-white dark:bg-gray-700 border border-primary rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed",
                  onClick: (e: Event) => e.stopPropagation(),
                  onMounted: (el: HTMLInputElement) => {
                    nextTick(() => {
                      el.focus();
                      el.select();
                    });
                  }
                }),
                editingLoading.value
                  ? h(UIcon, {
                      name: "lucide:loader-2",
                      class: "w-4 h-4 animate-spin text-primary",
                    })
                  : h("div", { class: "flex items-center gap-1" }, [
                      editingName.value.trim() !== originalName.value &&
                        h(UButton, {
                          icon: "lucide:check",
                          size: "xs",
                          color: "success",
                          variant: "solid",
                          onClick: (e: Event) => {
                            e.stopPropagation();
                            saveEdit(folder, currentOnRename.value || undefined);
                          },
                          class: "!p-1 !min-w-[24px] !w-6 !h-6 flex items-center justify-center",
                        }),
                      h(UButton, {
                        icon: "lucide:x",
                        size: "xs",
                        color: "error",
                        variant: "solid",
                        onClick: (e: Event) => {
                          e.stopPropagation();
                          cancelEdit();
                        },
                        class: "!p-1 !min-w-[24px] !w-6 !h-6 flex items-center justify-center",
                      }),
                    ]),
              ])
            : // Normal mode
              h("div", { class: "flex items-center gap-2 flex-1" }, [
                h(
                  "p",
                  {
                    class:
                      "font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-primary",
                    onDblclick: () => startRename(folder),
                  },
                  folder.name
                ),
                h(UButton, {
                  icon: "lucide:edit-3",
                  size: "xs",
                  variant: "ghost",
                  color: "neutral",
                  onClick: (e: Event) => {
                    e.stopPropagation();
                    startRename(folder);
                  },
                  class: "opacity-0 group-hover:opacity-100 transition-opacity ml-1",
                }),
              ]),
          folder.isSystem &&
            h(
              "span",
              {
                class:
                  "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
              },
              "System"
            ),
        ]),
        folder.description &&
          h(
            "p",
            {
              class: "text-xs text-gray-500 dark:text-gray-400 truncate",
            },
            folder.description
          ),
      ]),
    ]);
  }

  // Column configurations using the general system
  const columnConfigs: DataTableColumnConfig[] = [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => buildNameCell(row.original),
    },
    {
      id: "updatedAt",
      header: "Modified",
      format: "datetime",
    },
    {
      id: "fileCount",
      header: "Files",
      cell: ({ getValue }) => (getValue() as number) || 0,
    },
  ];

  // Build columns for folders
  const columns = computed<ColumnDef<any>[]>(() => {
    return columnConfigs.map(config => buildColumn(config));
  });

  // Actions configuration
  function getActionsConfig(refreshCallback: () => void): DataTableActionsConfig {
    return {
      actions: [
        {
          label: "Open",
          icon: "i-lucide-folder-open",
          onSelect: (folder) => {
            router.push(`/files/folders/${folder.id}`);
          },
        },
        {
          label: "Rename", 
          icon: "i-lucide-edit-3",
          onSelect: (folder) => {
            startRename(folder);
          },
        },
        {
          label: "Details",
          icon: "i-lucide-info", 
          onSelect: (folder) => {
            showFolderDetail(folder);
          },
        },
        {
          label: "Delete",
          icon: "i-lucide-trash-2",
          class: "text-red-500",
          onSelect: (folder) => {
            deleteFolder(folder, refreshCallback);
          },
        },
      ],
    };
  }

  // Add actions column
  function addActionsColumn(refreshCallback: () => void, onRename?: (folderId: string, newName: string) => Promise<void>) {
    // Store rename callback for inline editing
    currentOnRename.value = onRename || null;
    
    const actionsConfig = getActionsConfig(refreshCallback);
    const actionsColumn = buildActionsColumn(actionsConfig);
    
    return [...columns.value, actionsColumn];
  }

  return {
    columns,
    addActionsColumn,
  };
}