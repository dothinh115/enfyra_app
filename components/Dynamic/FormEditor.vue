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
        componentProps?: Record<string, any>;
        fieldProps?: Record<string, any>;
        [key: string]: any;
      }
  >;
}>();

const { tables, schemas } = useGlobalState();

const emit = defineEmits(["update:modelValue", "update:errors"]);

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
        label: column?.description || key,
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
          const updatedErrors = { ...props.errors };

          if (diags?.length > 0) {
            updatedErrors[key] = "Code error";
          } else {
            delete updatedErrors[key];
          }

          emit("update:errors", updatedErrors);
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
        ...componentPropsBase,
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
          <div class="prose" v-html="columnMap.get(key)?.description" />
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
