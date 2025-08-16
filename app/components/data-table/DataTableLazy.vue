<script setup lang="ts">
import type { DataTableProps } from "../../utils/types";

defineOptions({
  inheritAttrs: false
});

defineProps<DataTableProps>();

defineEmits<{
  'row-click': [row: any];
  'bulk-delete': [selectedRows: any[]];
}>();

const DataTable = defineAsyncComponent(() => 
  import('./DataTable.vue')
);
</script>

<template>
  <Suspense>
    <DataTable v-bind="$props" />
    <template #fallback>
      <CommonLoadingState
        title="Loading table..."
        description="Setting up data table components"
        size="sm"
        type="card"
        context="page"
      />
    </template>
  </Suspense>
</template>