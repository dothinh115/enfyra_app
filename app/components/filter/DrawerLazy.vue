<template>
  <div>
    <Suspense>
      <FilterDrawer
        :model-value="props.modelValue"
        :filter-value="props.filterValue"
        :table-name="props.tableName"
        @update:model-value="(value) => emit('update:modelValue', value)"
        @update:filter-value="(value) => emit('update:filterValue', value)"
        @apply="() => emit('apply')"
        @clear="() => emit('clear')"
      />
      <template #fallback>
        <div class="flex items-center justify-center p-8">
          <div class="flex items-center gap-3">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span class="text-sm text-gray-600">Loading filter...</span>
          </div>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
const FilterDrawer = defineAsyncComponent(() => import('./Drawer.vue'))

const props = defineProps<{
  modelValue: boolean;
  filterValue: FilterGroup;
  tableName: string;
}>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:filterValue": [value: FilterGroup];
  apply: [];
  clear: [];
}>()
</script>