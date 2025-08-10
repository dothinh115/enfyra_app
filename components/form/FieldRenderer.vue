<script setup lang="ts">
// Vue functions are auto-imported
import { UInput, UTextarea, USwitch, USelect } from "#components";

const props = withDefaults(
  defineProps<{
    keyName: string;
    formData: Record<string, any>;
    columnMap: Map<string, any>;
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
    errors: Record<string, string>;
  }>(),
  {
    errors: () => ({}),
  }
);

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

function getComponentConfigByKey(key: string) {
  const column = props.columnMap.get(key);
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
        modelValue: props.formData[key] ?? null,
        "onUpdate:modelValue": (val: any) => {
          updateFormData(key, val);
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
        modelValue: props.formData[key] ?? false,
        "onUpdate:modelValue": (val: boolean) => {
          updateFormData(key, val);
        },
      },
      fieldProps,
    };
  }

  if (finalType === "select" || finalType === "enum") {
    // Get options from config or from schema enumValues
    let items = config.options ?? [];

    // If no options provided and field type is enum, get from schema
    if (items.length === 0) {
      const column = props.columnMap.get(key);
      if (column?.type === "enum" && column?.enumValues) {
        items = column.enumValues.map((opt: string) => ({
          label: opt,
          value: opt,
        }));
      }
    }

    return {
      component: USelect,
      componentProps: {
        ...componentPropsBase,
        items: items,
        modelValue: props.formData[key] ?? null,
        "onUpdate:modelValue": (val: any) => {
          updateFormData(key, val);
        },
      },
      fieldProps,
    };
  }

  if (finalType === "array") {
    return {
      component: resolveComponent("SimpleArrayEditor"),
      componentProps: {
        ...componentPropsBase,
        modelValue: props.formData[key] ?? [],
        "onUpdate:modelValue": (val: string[]) => {
          updateFormData(key, val);
        },
      },
      fieldProps,
    };
  }

  if (finalType === "simple-json") {
    // If field is disabled, show disabled input instead of code editor
    if (disabled) {
      return {
        component: UInput,
        componentProps: {
          ...componentPropsBase,
          type: "text",
          modelValue: props.formData[key] ?? "",
          "onUpdate:modelValue": (val: string) => {
            updateFormData(key, val);
          },
        },
        fieldProps: {
          ...fieldProps,
          class: "col-span-2",
        },
      };
    }

    return {
      component: resolveComponent("FormCodeEditorLazy"),
      componentProps: {
        ...componentPropsBase,
        modelValue: props.formData[key] ?? "",
        language: "json",
        height: config.height || "300px", // Default height for JSON fields
        "onUpdate:modelValue": (val: string) => {
          updateFormData(key, val);
        },
        onDiagnostics: (diags: any[]) => {
          const updated = { ...props.errors };
          if (diags?.length > 0) {
            updated[key] = "JSON syntax error";
          } else {
            delete updated[key];
          }
          updateErrors(updated);
        },
      },
      fieldProps: {
        ...fieldProps,
        class: "col-span-2",
      },
    };
  }

  if (finalType === "text") {
    return {
      component: UTextarea,
      componentProps: {
        ...componentPropsBase,
        rows: 4,
        variant: "subtle",
        autoresize: true,
        class: "w-full font-mono text-xs",
        modelValue: props.formData[key],
        "onUpdate:modelValue": (val: string) => {
          updateFormData(key, val);
        },
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
        modelValue: props.formData[key] ?? "",
        "onUpdate:modelValue": (val: string) => {
          updateFormData(key, val);
        },
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
        modelValue: props.formData[key] ?? 0,
        "onUpdate:modelValue": (val: string | number) => {
          updateFormData(key, val);
        },
      },
      fieldProps,
    };
  }

  if (finalType === "code") {
    // If field is disabled, show disabled input instead of code editor
    if (disabled) {
      return {
        component: UInput,
        componentProps: {
          ...componentPropsBase,
          type: "text",
          modelValue: props.formData[key] ?? "",
          "onUpdate:modelValue": (val: string) => {
            updateFormData(key, val);
          },
        },
        fieldProps: {
          ...fieldProps,
          class: "col-span-2",
        },
      };
    }

    return {
      component: resolveComponent("FormCodeEditorLazy"),
      componentProps: {
        ...componentPropsBase,
        modelValue: props.formData[key] ?? "",
        language: config.language ?? "javascript",
        height: config.height || "400px", // Default height for code fields
        "onUpdate:modelValue": (val: string) => {
          updateFormData(key, val);
        },
        onDiagnostics: (diags: any[]) => {
          const updated = { ...props.errors };
          if (diags?.length > 0) {
            updated[key] = "Code error";
          } else {
            delete updated[key];
          }
          updateErrors(updated);
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
        modelValue: props.formData[key] ?? [],
        "onUpdate:modelValue": (val: string[]) => {
          updateFormData(key, val);
        },
      },
      fieldProps,
    };
  }

  if (finalType === "richtext") {
    // If field is disabled, show disabled input instead of rich text editor
    if (disabled) {
      return {
        component: UInput,
        componentProps: {
          ...componentPropsBase,
          type: "text",
          class: "w-full bg-gray-100",
          modelValue: props.formData[key] ?? "",
          "onUpdate:modelValue": (val: string) => {
            updateFormData(key, val);
          },
        },
        fieldProps: {
          ...fieldProps,
          class: "col-span-2",
        },
      };
    }

    return {
      component: resolveComponent("FormRichTextEditorLazy"),
      componentProps: {
        modelValue: props.formData[key] ?? "",
        editable: !disabled,
        "onUpdate:modelValue": (val: string) => {
          updateFormData(key, val);
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
      modelValue: props.formData[key] ?? "",
      "onUpdate:modelValue": (val: string) => {
        updateFormData(key, val);
      },
    },
    fieldProps,
  };
}

const componentConfig = computed(() => getComponentConfigByKey(props.keyName));
</script>

<template>
  <component
    :is="componentConfig.component"
    v-bind="componentConfig.componentProps"
  />
</template>
