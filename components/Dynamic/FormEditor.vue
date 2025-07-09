<script setup lang="ts">
import { computed, resolveComponent } from "vue";
import { UInput, UTextarea, USwitch, USelect } from "#components";

const props = defineProps<{
  modelValue: Record<string, any>;
  tableName: string;
  excluded?: string[];
  includes?: string[];
  errors?: Record<string, string>;
  typeMap?: Record<
    string,
    | string
    | {
        type?: string;
        disabled?: boolean;
        placeholder?: string;
        [key: string]: any;
      }
  >;
}>();

const { tables, schemas } = useGlobalState();

const visibleKeys = computed(() => {
  const columnDefTable = tables.value.find((t) => t.name === props.tableName);
  const allKeys = Object.keys(formData.value || {});

  let filtered: string[];

  if (props.includes?.length) {
    filtered = allKeys.filter((key) => props.includes!.includes(key));
  } else if (props.excluded?.length) {
    filtered = allKeys.filter((key) => !props.excluded!.includes(key));
  } else {
    filtered = allKeys;
  }

  if (!columnDefTable) return filtered;

  // Sắp xếp theo id trong column_definition
  const totalFields = schemas.value[props.tableName].definition;
  const sorted = totalFields
    .slice()
    .sort((a: any, b: any) => {
      const isSpecial = (field: any) =>
        field.name === "createdAt" || field.name === "updatedAt";
      if (isSpecial(a) && !isSpecial(b)) return 1;
      if (!isSpecial(a) && isSpecial(b)) return -1;

      if (a.fieldType !== b.fieldType) {
        return a.fieldType === "column" ? -1 : 1;
      }

      return a.id - b.id;
    })
    .map((col: any) => col.name || col.propertyName)
    .filter((name: string) => filtered.includes(name));

  return sorted;
});

const emit = defineEmits(["update:modelValue"]);

const formData = computed({
  get: () => props.modelValue,
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

function getComponentConfigByKey(key: string) {
  const column = columnMap.value.get(key);
  const isRelation = column?.fieldType === "relation";

  const manualConfig = props.typeMap?.[key];
  const config =
    typeof manualConfig === "string"
      ? { type: manualConfig }
      : manualConfig || {};

  const finalType = config.type || column?.type;
  const isCreatedOrUpdatedAt = key === "createdAt" || key === "updatedAt";
  const disabled = config.disabled ?? isCreatedOrUpdatedAt;

  const commonInputProps = {
    class: "w-full",
    placeholder: config.placeholder || column?.placeholder || key,
    disabled,
    ...(config.componentProps || {}),
  };

  const fieldProps = {
    ...(config.fieldProps || {}),
  };

  // 👉 Nếu là relation field → dùng RelationSelectorField
  if (isRelation) {
    return {
      component: resolveComponent("RelationInlineEditor"),
      componentProps: {
        relationMeta: column,
        modelValue: formData.value[key],
        "onUpdate:modelValue": (val: any) => {
          formData.value[key] = val;
        },
      },
      fieldProps,
    };
  }

  // 👉 Kiểu boolean
  if (finalType === "boolean") {
    return {
      component: USwitch,
      componentProps: {
        label: column?.description || key,
        disabled,
        ...(config.componentProps || {}),
      },
      fieldProps,
    };
  }

  // 👉 Kiểu select
  if (finalType === "select") {
    return {
      component: USelect,
      componentProps: {
        ...commonInputProps,
        items: config.options ?? [],
      },
      fieldProps,
    };
  }

  // 👉 Mảng đơn giản
  if (finalType === "array") {
    return {
      component: resolveComponent("SimpleArrayEditor"),
      componentProps: {
        ...commonInputProps,
        modelValue: formData.value[key] ?? [],
        "onUpdate:modelValue": (val: string[]) => {
          formData.value[key] = val;
        },
      },
      fieldProps,
    };
  }

  // 👉 Văn bản dài hoặc json
  if (finalType === "simple-json" || finalType === "text") {
    return {
      component: UTextarea,
      componentProps: {
        ...commonInputProps,
        rows: 4,
        variant: "subtle",
        autoresize: true,
        class: "w-full font-mono text-xs",
      },
      fieldProps: {
        ...fieldProps,
        class: "col-span-2",
      },
    };
  }

  if (finalType === "code") {
    return {
      component: resolveComponent("CodeEditor"),
      componentProps: {
        modelValue: formData.value[key] ?? "",
        language: config.language ?? "javascript",
        "onUpdate:modelValue": (val: string) => {
          formData.value[key] = val;
        },
      },
      fieldProps: {
        ...fieldProps,
        class: "col-span-2",
      },
    };
  }

  // 👉 Mảng dạng select
  if (finalType === "array-select") {
    return {
      component: resolveComponent("ArraySelectEditor"),
      componentProps: {
        ...commonInputProps,
        options: config.options ?? [],
        modelValue: formData.value[key] ?? [],
        "onUpdate:modelValue": (val: string[]) => {
          formData.value[key] = val;
        },
      },
      fieldProps,
    };
  }

  // 👉 Richtext
  if (finalType === "richtext") {
    return {
      component: resolveComponent("RichTextEditor"),
      componentProps: {
        "v-model": formData.value[key] ?? "",
        editable: !disabled,
        "onUpdate:modelValue": (val: string) => {
          formData.value[key] = val;
        },
      },
      fieldProps: {
        ...fieldProps,
        class: "col-span-2",
      },
    };
  }

  // 👉 Default: Input thường
  return {
    component: UInput,
    componentProps: {
      ...commonInputProps,
      type: finalType === "int" ? "number" : "text",
    },
    fieldProps,
  };
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
    <template v-for="key in visibleKeys" :key="key">
      <UFormField
        v-bind="getComponentConfigByKey(key).fieldProps"
        :label="key"
        class="rounded-lg border border-muted p-4"
        :error="props.errors && props.errors[key]"
      >
        <template #description>
          <span
            class="block min-h-[1.25rem] text-xs text-muted-foreground italic"
          >
            {{ columnMap.get(key)?.description || "" }}
          </span>
        </template>
        <component
          :is="getComponentConfigByKey(key).component"
          v-bind="getComponentConfigByKey(key).componentProps"
          v-model="formData[key]"
        />
      </UFormField>
    </template>
  </div>
</template>
