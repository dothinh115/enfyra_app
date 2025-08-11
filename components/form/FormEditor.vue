<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField
      v-for="field in visibleFields"
      :key="field.name || field.propertyName"
      :key-name="field.name || field.propertyName"
      :form-data="modelValue"
      :column-map="fieldMap"
      :type-map="typeMapWithGenerated"
      :errors="errors"
      :readonly="readonly"
      @update:form-data="updateFormData"
      @update:errors="updateErrors"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: Record<string, any>;
    errors: Record<string, string>;
    tableName: string;
    excluded?: string[];
    includes?: string[];
    typeMap?: Record<string, any>;
    readonly?: boolean;
  }>(),
  {
    excluded: () => [],
    includes: () => [],
    typeMap: () => ({}),
    readonly: false,
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, any>];
  "update:errors": [errors: Record<string, string>];
}>();

const { definition, fieldMap, sortFieldsByOrder } = useSchema(props.tableName);

const visibleFields = computed(() => {
  let fields = definition.value;

  if (props.includes.length > 0) {
    fields = fields.filter((field: any) => {
      const key = field.name || field.propertyName;
      return key && props.includes.includes(key);
    });
  }

  fields = fields.filter((field: any) => {
    const key = field.name || field.propertyName;
    if (!key) return false;
    if (props.excluded.includes(key)) return false;
    if (["isSystem", "isRootAdmin"].includes(key)) return false;
    return true;
  });

  fields = fields.filter((field: any) => {
    const key = field.name || field.propertyName;
    if (!key) return false;

    return key in props.modelValue;
  });

  return sortFieldsByOrder(fields);
});

const typeMapWithGenerated = computed(() => {
  const result = { ...props.typeMap };

  for (const field of visibleFields.value) {
    const key = field.name || field.propertyName;
    if (key && field.isGenerated === true) {
      if (result[key]) {
        result[key] = {
          ...result[key],
          disabled: true,
        };
      } else {
        result[key] = {
          disabled: true,
        };
      }
    }
  }

  return result;
});

function updateFormData(key: string, value: any) {
  const newValue = { ...props.modelValue, [key]: value };
  emit("update:modelValue", newValue);
}

function updateErrors(errors: Record<string, string>) {
  emit("update:errors", errors);
}
</script>
