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
// Vue functions are auto-imported
import FormField from "./Field.vue";

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

// Fields to display
const visibleFields = computed(() => {
  let fields = definition.value;

  // Filter by includes if specified
  if (props.includes.length > 0) {
    fields = fields.filter((field: any) => {
      const key = field.name || field.propertyName;
      return key && props.includes.includes(key);
    });
  }

  // Filter by excluded
  fields = fields.filter((field: any) => {
    const key = field.name || field.propertyName;
    if (!key) return false;
    if (props.excluded.includes(key)) return false;
    if (["isSystem", "isRootAdmin"].includes(key)) return false;
    return true;
  });

  // Tự động loại bỏ các field không có trong v-model
  fields = fields.filter((field: any) => {
    const key = field.name || field.propertyName;
    if (!key) return false;

    // Chỉ hiển thị field có trong v-model
    return key in props.modelValue;
  });

  // Sort fields using helper function from useSchema
  return sortFieldsByOrder(fields);
});

// Type map with generated fields disabled
const typeMapWithGenerated = computed(() => {
  const result = { ...props.typeMap };

  // Check each field for isGenerated and disable if true
  for (const field of visibleFields.value) {
    const key = field.name || field.propertyName;
    if (key && field.isGenerated === true) {
      // If field already has typeMap config, merge with disabled
      if (result[key]) {
        result[key] = {
          ...result[key],
          disabled: true,
        };
      } else {
        // Create new config with disabled
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
