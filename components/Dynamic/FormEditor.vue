<script setup lang="ts">
import { computed, resolveComponent } from "vue";
import { UInput, UTextarea, USwitch, USelect } from "#components";

const props = defineProps<{
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
}>();

const emit = defineEmits(["update:modelValue", "update:errors"]);

const { tables, schemas } = useGlobalState();

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

const visibleKeys = computed(() => {
  const table = tables.value.find((t) => t.name === props.tableName);
  const allKeys = Object.keys(formData.value || {});
  let filtered: string[];

  if (props.includes?.length) {
    filtered = allKeys.filter((key) => props.includes!.includes(key));
  } else if (props.excluded?.length) {
    filtered = allKeys.filter((key) => !props.excluded!.includes(key));
  } else {
    filtered = allKeys;
  }

  if (!table) return filtered;

  const definition = schemas.value[props.tableName].definition || [];
  const sorted = definition
    .slice()
    .sort((a: any, b: any) => {
      const isSpecial = (f: any) =>
        f.name === "createdAt" || f.name === "updatedAt";
      if (isSpecial(a) && !isSpecial(b)) return 1;
      if (!isSpecial(a) && isSpecial(b)) return -1;
      if (a.fieldType !== b.fieldType) return a.fieldType === "column" ? -1 : 1;
      return a.id - b.id;
    })
    .map((col: any) => col.name || col.propertyName)
    .filter((name: string) => filtered.includes(name));

  return sorted;
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
  const isSystemField = key === "createdAt" || key === "updatedAt";
  const disabled = config.disabled ?? isSystemField;

  const fieldProps = {
    ...config.fieldProps,
  };

  const componentPropsBase = {
    disabled,
    placeholder: config.placeholder || column?.placeholder || key,
    class: "w-full",
    ...config.componentProps,
  };

  if (isRelation) {
    return {
      component: resolveComponent("RelationInlineEditor"),
      componentProps: {
        ...componentPropsBase,
        relationMeta: column,
        modelValue: formData.value[key],
        "onUpdate:modelValue": (val: any) => {
          formData.value[key] = val;
        },
      },
      fieldProps,
    };
  }

  if (finalType === "boolean") {
    return {
      component: USwitch,
      componentProps: {
        ...componentPropsBase,
        // label: column?.description || key,
      },
      fieldProps,
    };
  }

  if (finalType === "select") {
    return {
      component: USelect,
      componentProps: {
        ...componentPropsBase,
        items: config.options ?? [],
      },
      fieldProps,
    };
  }

  if (finalType === "array") {
    return {
      component: resolveComponent("SimpleArrayEditor"),
      componentProps: {
        ...componentPropsBase,
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
        ...componentPropsBase,
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

  if (finalType === "textarea") {
    return {
      component: UTextarea,
      componentProps: {
        ...componentPropsBase,
        rows: 3,
      },
      fieldProps,
    };
  }

  if (finalType === "number") {
    return {
      component: UInput,
      componentProps: {
        ...componentPropsBase,
        type: "number",
      },
      fieldProps,
    };
  }

  if (finalType === "code") {
    return {
      component: resolveComponent("CodeEditor"),
      componentProps: {
        ...componentPropsBase,
        modelValue: formData.value[key] ?? "",
        language: config.language ?? "javascript",
        "onUpdate:modelValue": (val: string) => {
          formData.value[key] = val;
        },
        onDiagnostics: (diags: any[]) => {
          const updated = { ...props.errors };
          if (diags?.length > 0) {
            updated[key] = "Code error";
          } else {
            delete updated[key];
          }
          emit("update:errors", updated);
        },
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
        ...componentPropsBase,
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
      ...componentPropsBase,
      type: finalType === "int" ? "number" : "text",
    },
    fieldProps,
  };
}

function renderValue(key: string): string {
  const val = formData.value[key];
  const column = columnMap.value.get(key);
  const isRelation = column?.fieldType === "relation";

  if (val === null || val === undefined) return "—";

  // If it's a relation (1-1 or 1-n)
  if (isRelation) {
    if (Array.isArray(val)) {
      const ids = val.map((item) =>
        item && typeof item === "object" && "id" in item ? item.id : "?"
      );
      return ids.length ? ids.join(", ") : "—";
    }

    if (typeof val === "object") {
      return "id" in val ? String(val.id) : JSON.stringify(val, null, 2);
    }
  }

  // Boolean
  if (typeof val === "boolean") return val ? "true" : "false";

  // Array (not relation)
  if (Array.isArray(val)) return val.length ? val.join(", ") : "—";

  // Object (non-relation)
  if (typeof val === "object") {
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return "[object]";
    }
  }

  // Default: primitive
  return String(val);
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
    <template v-for="key in visibleKeys" :key="key">
      <UFormField
        v-bind="getComponentConfigByKey(key).fieldProps"
        :label="key"
        class="rounded-lg border border-muted p-4"
        :error="props.errors?.[key]"
      >
        <template #description v-if="columnMap.get(key)?.description">
          <div v-html="columnMap.get(key)?.description" />
        </template>

        <component
          v-if="!props.readonly"
          :is="getComponentConfigByKey(key).component"
          v-bind="getComponentConfigByKey(key).componentProps"
          v-model="formData[key]"
        />
        <div v-else class="text-sm whitespace-pre-wrap font-mono">
          {{ renderValue(key) }}
        </div>
      </UFormField>
    </template>
  </div>
</template>
