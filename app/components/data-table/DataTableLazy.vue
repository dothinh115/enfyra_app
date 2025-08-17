<script setup lang="ts">
import type { DataTableProps } from "../../utils/types";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<DataTableProps>();

defineEmits<{
  "row-click": [row: any];
  "bulk-delete": [selectedRows: any[]];
}>();

const DataTable = defineAsyncComponent(() => import("./DataTable.vue"));
</script>

<template>
  <div>
    <Suspense>
      <DataTable
        :data="props.data"
        :columns="props.columns"
        :page-size="props.pageSize"
        :loading="props.loading"
        :selectable="props.selectable"
        @row-click="(row) => $emit('row-click', row)"
        @bulk-delete="(selectedRows) => $emit('bulk-delete', selectedRows)"
      />
      <template #fallback>
        <CommonLoadingState
          title="Loading table..."
          description="Setting up data table components"
          size="sm"
          type="spinner"
          context="page"
        />
      </template>
    </Suspense>
  </div>
</template>
