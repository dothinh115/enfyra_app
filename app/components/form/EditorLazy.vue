<script setup lang="ts">
defineOptions({
  inheritAttrs: false
});

defineProps<{
  modelValue: Record<string, any>;
  errors: Record<string, string>;
  tableName: string;
  excluded?: string[];
  includes?: string[];
  typeMap?: Record<string, any>;
  readonly?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: Record<string, any>];
  'update:errors': [errors: Record<string, string>];
}>();

const FormEditor = defineAsyncComponent(() => 
  import('./Editor.vue')
);
</script>

<template>
  <Suspense>
    <FormEditor v-bind="$props" />
    <template #fallback>
      <CommonLoadingState
        title="Loading form editor..."
        description="Setting up form components"
        size="sm"
        type="form"
        context="page"
      />
    </template>
  </Suspense>
</template>