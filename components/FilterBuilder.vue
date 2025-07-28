<script setup lang="ts">
// Legacy wrapper - delegates to new modular FilterBuilder
// FilterBuilder auto-imported by Nuxt
// Types auto-imported from utils

defineProps<{
  modelValue: any;
  schemas: Record<string, any>;
  tableName: string;
  rootTableName?: string;
  readonly?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: any];
}>();
</script>

<template>
  <FilterBuilder 
    :model-value="modelValue"
    :schemas="schemas"
    :table-name="tableName" 
    :root-table-name="rootTableName"
    :readonly="readonly"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>