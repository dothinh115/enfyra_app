<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        v-for="field in visibleFields"
        :key="field.name || field.propertyName"
        :key-name="field.name || field.propertyName"
        :form-data="modelValue"
        :column-map="fieldMap"
        :type-map="typeMapWithGenerated"
        :errors="errors"
        @update:form-data="updateFormData"
        @update:errors="updateErrors"
        class="relative group"
      />
    </div>
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
  }>(),
  {
    excluded: () => [],
    includes: () => [],
    typeMap: () => ({}),
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, any>];
  "update:errors": [errors: Record<string, string>];
  "update:hasChanges": [hasChanges: boolean];
}>();

const { definition, fieldMap, sortFieldsByOrder, useFormChanges } = useSchema(
  props.tableName
);
// Form change tracking
const formChanges = useFormChanges();
const originalData = ref<Record<string, any>>({});

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

    // Allow relation fields to pass through (they don't need to exist in form data initially)
    if (field.fieldType === "relation") return true;

    const hasKey = key in props.modelValue;
    return hasKey;
  });

  // Filter out relation fields that don't have routes
  const { routes, tables } = useGlobalState();
  fields = fields.filter((field: any) => {
    if (field.fieldType !== "relation") return true;

    // Check if relation target table has route
    const tableId = field.targetTable?.id;
    if (!tableId) return false;

    const tableName = tables.value.find((t: any) => t.id === tableId)?.name;
    if (!tableName) return false;

    const hasRoute = routes.value.some((r: any) => {
      const routePath = r.path.replace(/^\/+/, "");
      return routePath === tableName;
    });

    return hasRoute;
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

// Initialize original data when modelValue changes (first load)
watch(
  () => props.modelValue,
  (newValue) => {
    if (
      newValue &&
      Object.keys(newValue).length > 0 &&
      Object.keys(originalData.value).length === 0
    ) {
      originalData.value = JSON.parse(JSON.stringify(newValue));
      formChanges.update(newValue);
    }
  },
  { immediate: true, deep: true }
);

// Watch for form changes and emit hasChanges
watch(
  () => props.modelValue,
  (newValue) => {
    if (
      newValue &&
      Object.keys(newValue).length > 0 &&
      Object.keys(originalData.value).length > 0
    ) {
      formChanges.checkChanges(newValue);
      emit("update:hasChanges", formChanges.hasChanges.value);
    }
  },
  { deep: true }
);

// Expose method to confirm form changes (call after successful save)
defineExpose({
  confirmChanges: () => {
    if (props.modelValue && Object.keys(props.modelValue).length > 0) {
      originalData.value = JSON.parse(JSON.stringify(props.modelValue));
      formChanges.update(props.modelValue);
      emit("update:hasChanges", false);
    }
  },
});
</script>
