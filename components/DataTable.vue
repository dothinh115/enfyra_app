<script setup lang="ts">
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/vue-table";
import { computed, ref, h } from "vue";

export interface DataTableProps {
  data: any[];
  columns: ColumnDef<any>[];
  pageSize?: number;
  loading?: boolean;
  onRowClick?: (row: any) => void;
  selectable?: boolean;
  onBulkDelete?: (selectedRows: any[]) => void;
}

const props = withDefaults(defineProps<DataTableProps>(), {
  pageSize: 10,
  loading: false,
  selectable: false,
});


// Table state
const sorting = ref<SortingState>([]);
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref({});

// Enhanced columns with checkbox if selectable
const enhancedColumns = computed(() => {
  if (!props.selectable) return props.columns;
  
  const selectColumn: ColumnDef<any> = {
    id: 'select',
    header: ({ table }) => h('input', {
      type: 'checkbox',
      class: 'rounded w-5 h-5 cursor-pointer block mx-auto',
      checked: table.getIsAllRowsSelected(),
      indeterminate: table.getIsSomeRowsSelected(),
      onChange: table.getToggleAllRowsSelectedHandler(),
      onClick: (e: Event) => e.stopPropagation(),
    }),
    cell: ({ row }) => h('div', {
      class: 'flex items-center justify-center'
    }, [
      h('input', {
        type: 'checkbox',
        class: 'rounded w-5 h-5 cursor-pointer',
        checked: row.getIsSelected(),
        disabled: !row.getCanSelect(),
        onChange: row.getToggleSelectedHandler(),
        onClick: (e: Event) => e.stopPropagation(),
      })
    ]),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  };
  
  return [selectColumn, ...props.columns];
});

// Create table instance
const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return enhancedColumns.value;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  enableRowSelection: true,
  onSortingChange: (updater) => {
    sorting.value = typeof updater === "function" ? updater(sorting.value) : updater;
  },
  onColumnVisibilityChange: (updater) => {
    columnVisibility.value = typeof updater === "function" ? updater(columnVisibility.value) : updater;
  },
  onRowSelectionChange: (updater) => {
    rowSelection.value = typeof updater === "function" ? updater(rowSelection.value) : updater;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
  },
  initialState: {
    pagination: {
      pageSize: props.pageSize,
    },
  },
});

// Column visibility dropdown
const columnDropdownItems = computed(() =>
  table.getAllColumns()
    .filter((col) => col.getCanHide())
    .map((col) => ({
      label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
      type: "checkbox" as const,
      checked: col.getIsVisible(),
      onSelect: (e: Event) => {
        col.toggleVisibility();
        e.preventDefault();
      },
    }))
);

// Selected rows for bulk operations
const selectedRows = computed(() => {
  return table.getSelectedRowModel().rows.map(row => row.original);
});

const hasSelection = computed(() => {
  return Object.keys(rowSelection.value).length > 0;
});

// Bulk actions
async function handleBulkDelete() {
  if (props.onBulkDelete && selectedRows.value.length > 0) {
    await props.onBulkDelete(selectedRows.value);
    // Clear selection after delete
    rowSelection.value = {};
  }
}

// Mobile responsive check
const isMobile = ref(false);
onMounted(() => {
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768;
  };
  checkMobile();
  window.addEventListener("resize", checkMobile);
  onUnmounted(() => window.removeEventListener("resize", checkMobile));
});

</script>

<template>
  <div class="w-full space-y-4">
    <!-- Header Controls -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <slot name="header-actions" />
        
        <!-- Bulk Actions -->
        <div v-if="selectable && hasSelection" class="flex items-center gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedRows.length }} selected
          </span>
          <UButton
            v-if="onBulkDelete"
            icon="i-lucide-trash-2"
            size="sm"
            color="error"
            variant="solid"
            @click.stop="handleBulkDelete"
          >
            Delete Selected
          </UButton>
        </div>
      </div>
      
      <UDropdownMenu
        :items="columnDropdownItems"
        popper="{ placement: 'bottom-end' }"
      >
        <template #default>
          <UButton icon="i-lucide-columns" size="sm" variant="soft">
            Columns
          </UButton>
        </template>
      </UDropdownMenu>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="w-full">
      <CommonLoadingState type="table" size="md" context="page" />
    </div>

    <!-- Desktop Table View -->
    <div 
      v-else-if="!isMobile" 
      class="overflow-auto rounded-lg border border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out"
    >
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th
              v-for="header in table.getFlatHeaders()"
              :key="header.id"
              :class="[
                'px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100',
                header.column.getCanSort() && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800',
              ]"
              @click="header.column.getToggleSortingHandler()?.($event)"
            >
              <div class="flex items-center gap-2">
                <span v-if="typeof header.column.columnDef.header === 'string'">
                  {{ header.column.columnDef.header }}
                </span>
                <component
                  v-else
                  :is="header.column.columnDef.header"
                  v-bind="header.getContext()"
                />
                <UIcon
                  v-if="header.column.getCanSort()"
                  :name="
                    header.column.getIsSorted() === 'asc'
                      ? 'i-lucide-chevron-up'
                      : header.column.getIsSorted() === 'desc'
                      ? 'i-lucide-chevron-down'
                      : 'i-lucide-chevrons-up-down'
                  "
                  class="w-4 h-4 text-gray-400"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            :class="[
              'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
              onRowClick && 'cursor-pointer',
            ]"
            @click="onRowClick?.(row.original)"
          >
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
            >
              <span v-if="typeof cell.column.columnDef.cell !== 'function'">
                {{ cell.getValue() }}
              </span>
              <component
                v-else
                :is="cell.column.columnDef.cell"
                v-bind="cell.getContext()"
              />
            </td>
          </tr>
          <tr v-if="!table.getRowModel().rows.length">
            <td
              :colspan="table.getFlatHeaders().length"
              class="px-4 py-8 text-center"
            >
              <CommonEmptyState
                title="No data available"
                description="There are no records to display"
                icon="lucide:database"
                size="sm"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div v-else class="space-y-3 transition-all duration-300 ease-in-out">
      <div
        v-for="row in table.getRowModel().rows"
        :key="row.id"
        :class="[
          'p-4 rounded-lg border border-gray-200 dark:border-gray-800',
          'hover:border-gray-300 dark:hover:border-gray-700 transition-colors',
          onRowClick && !selectable && 'cursor-pointer',
          selectable && row.getIsSelected() && 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-950',
        ]"
        @click="!selectable && onRowClick?.(row.original)"
      >
        <div class="flex items-start justify-between">
          <div class="space-y-2 flex-1">
            <div
              v-for="cell in row.getVisibleCells().filter(c => c.column.id !== 'select').slice(0, 3)"
              :key="cell.id"
              class="flex items-center justify-between"
            >
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ cell.column.columnDef.header }}
              </span>
              <span class="text-sm text-gray-900 dark:text-gray-100">
                <span v-if="typeof cell.column.columnDef.cell !== 'function'">
                  {{ cell.getValue() }}
                </span>
                <component
                  v-else
                  :is="cell.column.columnDef.cell"
                  v-bind="cell.getContext()"
                />
              </span>
            </div>
          </div>
          
          <!-- Mobile Selection Checkbox -->
          <div v-if="selectable" class="ml-3">
            <input
              type="checkbox"
              class="rounded w-5 h-5 cursor-pointer"
              :checked="row.getIsSelected()"
              :disabled="!row.getCanSelect()"
              @click.stop
              @change="row.getToggleSelectedHandler()?.($event)"
            />
          </div>
        </div>
      </div>
      <div v-if="!table.getRowModel().rows.length" class="py-8">
        <CommonEmptyState
          title="No data available"
          description="There are no records to display"
          icon="lucide:database"
          size="sm"
        />
      </div>
    </div>

  </div>
</template>