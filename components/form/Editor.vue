<script setup lang="ts">
// Vue functions are auto-imported

const props = withDefaults(
  defineProps<{
    modelValue: Record<string, any>;
    errors: Record<string, string>;
    tableName: string;
    excluded?: string[];
    includes?: string[];
    typeMap?: Record<
      string,
      | string
      | {
          type?: string;
          disabled?: boolean;
          placeholder?: string;
          componentProps?: {
            allowDelete?: boolean;
            [key: string]: any;
          };
          fieldProps?: Record<string, any>;
          [key: string]: any;
        }
    >;
    readonly?: boolean;
  }>(),
  {
    errors: () => ({}),
    modelValue: () => ({}),
  }
);

const emit = defineEmits(["update:modelValue", "update:errors"]);

const { tables, schemas } = useGlobalState();

const formData = computed({
  get: () => props.modelValue || {},
  set: (val) => emit("update:modelValue", val),
});

const columnMap = computed(() => {
  const map = new Map<string, any>();
  const definition = schemas.value[props.tableName]?.definition || [];
  for (const field of definition) {
    const key = field.name || field.propertyName;
    if (key) map.set(key, field);
  }
  return map;
});

const visibleKeys = computed(() => {
  const allKeys = Object.keys(formData.value || {});
  let filtered: string[];

  if (props.includes?.length) {
    filtered = allKeys.filter((key: string) => props.includes!.includes(key));
  } else if (props.excluded?.length) {
    filtered = allKeys.filter((key: string) => !props.excluded!.includes(key));
  } else {
    filtered = allKeys;
  }

  // Sort by field id from schema definition, put relations at the end
  return filtered.sort((a, b) => {
    const fieldA = columnMap.value.get(a);
    const fieldB = columnMap.value.get(b);

    const isRelationA = fieldA?.fieldType === "relation";
    const isRelationB = fieldB?.fieldType === "relation";

    // Relations go to the end
    if (isRelationA && !isRelationB) return 1;
    if (!isRelationA && isRelationB) return -1;

    // For fields of same type, sort by id
    const idA = fieldA?.id || 999999;
    const idB = fieldB?.id || 999999;
    return idA - idB;
  });
});

function updateFormData(key: string, value: any) {
  const updated = { ...formData.value };
  updated[key] = value;
  emit("update:modelValue", updated);
}

function updateErrors(errors: Record<string, string>) {
  emit("update:errors", errors);
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
    <FormField
      v-for="key in visibleKeys"
      :key="key"
      :key-name="key"
      :form-data="formData"
      :column-map="columnMap"
      :type-map="typeMap"
      :errors="errors"
      :readonly="readonly"
      @update:form-data="updateFormData"
      @update:errors="updateErrors"
    />
  </div>
</template>
