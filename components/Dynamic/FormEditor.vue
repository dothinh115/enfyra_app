<script setup lang="ts">
import { computed, resolveComponent, type ShallowRef } from "vue";
import { UInput, UTextarea, USwitch, USelect } from "#components";
import { Editor, EditorContent, useEditor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";

const props = defineProps<{
  modelValue: Record<string, any>;
  tableName: string;
  excluded?: string[];
  includes?: string[];
  errors?: Record<string, string>;
  mode?: "relation" | "column";
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
const mode = ref(props.mode ?? "column");

const { tables } = useGlobalState();

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
  const totalFields =
    mode.value === "relation"
      ? [...columnDefTable.relations, ...columnDefTable.columns]
      : columnDefTable.columns;
  const sorted = totalFields
    .slice()
    .sort((a: any, b: any) => a.id - b.id)
    .map((col: any) => col.name || col.propertyName)
    .filter((name: string) => filtered.includes(name));
  return sorted;
});

const emit = defineEmits(["update:modelValue"]);

const formData = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const currentTable = computed(() =>
  tables.value.find((t) => t.name === props.tableName)
);

const columnMap = computed(() => {
  const map = new Map<string, any>();
  for (const col of currentTable.value?.columns || []) {
    map.set(col.name, col);
  }
  return map;
});

function getComponentConfigByKey(key: string) {
  const column = columnMap.value.get(key);
  const manualConfig = props.typeMap?.[key];
  const config =
    typeof manualConfig === "string"
      ? { type: manualConfig }
      : manualConfig || {};

  const finalType = config.type || column?.type;
  const disabled = config.disabled ?? false;

  const commonInputProps = {
    class: "w-full",
    placeholder: config.placeholder || column?.placeholder || key,
    disabled,
    ...(config.componentProps || {}),
  };

  const fieldProps = {
    ...(config.fieldProps || {}),
  };

  if (!column && !finalType) {
    return {
      component: UInput,
      componentProps: commonInputProps,
      fieldProps,
    };
  }

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
