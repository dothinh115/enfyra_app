<script setup lang="ts">
// Vue functions are auto-imported

const props = defineProps<{
  keyName: string;
  formData: Record<string, any>;
  columnMap: Map<string, any>;
  typeMap?: Record<string, any>;
  errors: Record<string, string>;
}>();

const emit = defineEmits<{
  "update:formData": [key: string, value: any];
  "update:errors": [errors: Record<string, string>];
}>();

function updateFormData(key: string, value: any) {
  emit("update:formData", key, value);
}

function updateErrors(errors: Record<string, string>) {
  emit("update:errors", errors);
}

const column = computed(() => props.columnMap.get(props.keyName));

const fieldProps = computed(() => {
  const manualConfig = props.typeMap?.[props.keyName];
  const config =
    typeof manualConfig === "string"
      ? { type: manualConfig }
      : manualConfig || {};

  // Get field type from schema
  const field = props.columnMap.get(props.keyName);
  const fieldType = config.type || field?.type;

  // Add col-span-2 for specific field types
  const baseProps = config.fieldProps || {};
  if (["richtext", "code", "simple-json", "text"].includes(fieldType)) {
    return {
      ...baseProps,
      class: `${baseProps.class || ""} col-span-2`.trim(),
    };
  }

  return baseProps;
});
</script>

<template>
  <UFormField
    v-bind="fieldProps"
    :label="keyName"
    class="rounded-lg border border-muted p-4"
    :error="errors?.[keyName]"
  >
    <template #label>
      <span class="flex items-center gap-1">
        {{ keyName }}
        <span
          v-if="
            column?.isNullable === false &&
            column?.isGenerated !== true &&
            column?.type !== 'boolean' &&
            keyName !== 'createdAt' &&
            keyName !== 'updatedAt'
          "
          class="text-red-500"
          >*</span
        >
      </span>
    </template>

    <template #description v-if="column?.description">
      <div v-html="column?.description" />
    </template>

    <FormFieldRenderer
      :key-name="keyName"
      :form-data="formData"
      :column-map="columnMap"
      :type-map="typeMap"
      :errors="errors"
      @update:form-data="updateFormData"
      @update:errors="updateErrors"
    />
  </UFormField>
</template>
