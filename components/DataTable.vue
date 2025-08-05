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
import { computed, ref } from "vue";

export interface DataTableProps {
  data: any[];
  columns: ColumnDef<any>[];
  pageSize?: number;
  loading?: boolean;
  onRowClick?: (row: any) => void;
}

const props = withDefaults(defineProps<DataTableProps>(), {
  pageSize: 10,
  loading: false,
});


// Table state
const sorting = ref<SortingState>([]);
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref({});

// Create table instance
const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
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
          onRowClick && 'cursor-pointer',
        ]"
        @click="onRowClick?.(row.original)"
      >
        <div class="space-y-2">
          <div
            v-for="cell in row.getVisibleCells().slice(0, 3)"
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