<script setup lang="ts">
import { computed, ref, h } from "vue";

export interface ColumnConfig {
  accessorKey: string;
  header: string;
  maxWidth?: number;
  maxChar?: number;
  size?: number;
  tableName: string;
  cell?: (ctx: { row: Record<string, any>; index: number }) => any;
}

const props = defineProps<{
  data: any[];
  columns: ColumnConfig[];
  charWidth?: number;
}>();

const charPx = computed(() => props.charWidth ?? 6);

const defaultVisibleKeys = computed(() => {
  const cols = props.columns;
  const important = ["id", "name", "title", "__actions"];
  const selected: string[] = [];

  for (const col of cols) {
    if (
      important.includes(col.accessorKey) &&
      !selected.includes(col.accessorKey)
    ) {
      selected.push(col.accessorKey);
    }
  }

  for (const col of cols) {
    if (
      !selected.includes(col.accessorKey) &&
      (col.maxChar ?? 20) <= 100 &&
      selected.length < 5
    ) {
      selected.push(col.accessorKey);
    }
  }

  return selected;
});

const visibleKeys = ref<string[]>(defaultVisibleKeys.value);

const dropdownItems = computed(() =>
  props.columns
    .filter((col) => col.accessorKey !== "__actions")
    .map((col) => ({
      label: col.header || col.accessorKey,
      type: "checkbox" as const,
      checked: visibleKeys.value.includes(col.accessorKey),
      onSelect: (e: Event) => {
        visibleKeys.value = visibleKeys.value.includes(col.accessorKey)
          ? visibleKeys.value.filter((k) => k !== col.accessorKey)
          : [...visibleKeys.value, col.accessorKey];
        e.preventDefault();
      },
    }))
);

const renderedColumns = computed(() =>
  props.columns.filter((c) => visibleKeys.value.includes(c.accessorKey))
);

function calcWidth(col: ColumnConfig): number | undefined {
  return (
    col.size ??
    col.maxWidth ??
    (col.maxChar ? col.maxChar * charPx.value : undefined)
  );
}

function buildVNode(col: ColumnConfig, row: Record<string, any>) {
  const widthPx = calcWidth(col);
  const raw = row[col.accessorKey];
  const val = raw == null ? "" : String(raw);

  if (!widthPx) return val;

  const fitChars = Math.floor(widthPx / charPx.value);
  const truncated =
    val.length > fitChars ? val.slice(0, fitChars) + "..." : val;

  return h(
    "div",
    {
      class: "truncate whitespace-nowrap overflow-hidden",
      style: { width: `${widthPx}px`, maxWidth: `${widthPx}px` },
      title: val,
    },
    truncated
  );
}

function wrapAsComponent(renderer: () => any) {
  return {
    setup() {
      return () => renderer();
    },
  };
}
</script>

<template>
  <div class="space-y-2 w-full">
    <div class="flex justify-end">
      <UDropdownMenu
        :items="dropdownItems"
        popper="{ placement: 'bottom-end' }"
      >
        <template #default>
          <UButton icon="i-lucide-list" size="md" color="primary"
            >Chọn cột</UButton
          >
        </template>
      </UDropdownMenu>
    </div>

    <div class="overflow-auto w-full">
      <table
        class="min-w-full table-fixed border-separate border-spacing-0 text-sm"
      >
        <thead>
          <tr>
            <th
              v-for="col in renderedColumns"
              :key="col.accessorKey"
              :style="{ width: (calcWidth(col) ?? 'auto') + 'px' }"
              class="border-b border-muted px-3 py-2 text-left font-medium sticky top-0 bg-background z-10"
            >
              {{ col.header }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="props.data.length === 0">
            <td
              :colspan="renderedColumns.length"
              class="text-center py-6 text-muted-foreground"
            >
              <Icon
                name="i-lucide-database"
                class="inline-block w-5 h-5 mr-1"
              />
              Không có dữ liệu
            </td>
          </tr>

          <tr
            v-for="(row, rIndex) in props.data"
            :key="row.id ?? rIndex"
            class="even:bg-muted/40 hover:bg-muted transition-colors"
          >
            <td
              v-for="col in renderedColumns"
              :key="col.accessorKey"
              :style="{ width: (calcWidth(col) ?? 'auto') + 'px' }"
              class="border-b border-muted px-3 py-2 align-center"
            >
              <component
                :is="
                  wrapAsComponent(() =>
                    col.cell
                      ? col.cell({ row, index: rIndex })
                      : buildVNode(col, row)
                  )
                "
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
