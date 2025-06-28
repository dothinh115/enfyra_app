<script setup lang="ts">
import { computed, resolveComponent } from "vue";
import { UInput, UTextarea, USwitch, USelect } from "#components";

const props = defineProps<{
  modelValue: Record<string, any>;
  tableName: string;
  excluded?: string[];
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

const emit = defineEmits(["update:modelValue"]);

const formData = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const { tables } = useGlobalState();

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
  const fieldProps = {
    ...(config.fieldProps || {}),
  };

  const disabled = config.disabled ?? false;

  // Các props chung cho input-like
  const commonInputProps = {
    class: "w-full",
    placeholder: config.placeholder || column?.placeholder || key,
    disabled,
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
      },
      fieldProps,
    };
  }

  if (finalType === "select") {
    return {
      component: USelect,
      componentProps: {
        ...commonInputProps,
        options: config.options ?? [],
      },
      fieldProps,
    };
  }

  if (finalType === "array") {
    return {
      component: resolveComponent("SimpleArrayEditor"),
      componentProps: {
        "v-model": formData.value[key] ?? [],
        "onUpdate:modelValue": (val: string[]) => {
          formData.value[key] = val;
        },
        disabled,
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
        options: config.options ?? [],
        modelValue: formData.value[key] ?? [],
        "onUpdate:modelValue": (val: string[]) => {
          formData.value[key] = val;
        },
        disabled,
      },
      fieldProps,
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
    <template v-for="(value, key) in formData" :key="key">
      <UFormField
        v-if="!props.excluded?.includes(key)"
        v-bind="getComponentConfigByKey(key).fieldProps"
        :label="key"
        class="rounded-lg border border-muted p-4"
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
