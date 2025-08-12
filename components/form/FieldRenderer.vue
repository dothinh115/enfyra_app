<script setup lang="ts">
// Vue functions are auto-imported
import {
  ensureString,
  ensureArray,
  ensureBoolean,
  ensureNumber,
  ensureNotNull,
} from "~/utils/components/form";
import { UInput, UTextarea, USwitch, USelect, UCalendar } from "#components";
import { CalendarDate } from "@internationalized/date";

const props = defineProps<{
  keyName: string;
  formData: Record<string, any>;
  columnMap: Map<string, any>;
  typeMap?: Record<string, any>;
  errors: Record<string, string>;
  readonly?: boolean;
}>();

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

const column = computed(() => props.columnMap.get(props.keyName));

const fieldProps = computed(() => {
  const manualConfig = props.typeMap?.[props.keyName];
  const config =
    typeof manualConfig === "string"
      ? { type: manualConfig }
      : manualConfig || {};

  // Get field type from schema
  const field = props.columnMap.get(props.keyName);
  const fieldType = config.type || field?.type;

  // Add col-span-2 for specific field types
  const baseProps = config.fieldProps || {};
  if (["richtext", "code", "simple-json", "text"].includes(fieldType)) {
    return {
      ...baseProps,
      class: `${baseProps.class || ""} col-span-2`.trim(),
    };
  }

  return baseProps;
});

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
      component: resolveComponent("FormRelationInlineEditor"),
      componentProps: {
        ...componentPropsBase,
        relationMeta: column,
        modelValue: ensureNotNull(props.formData[key]),
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
        modelValue: ensureBoolean(props.formData[key]),
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
        modelValue: ensureNotNull(props.formData[key]),
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
        modelValue: ensureArray(props.formData[key]),
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
          modelValue: ensureString(props.formData[key]),
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
      component: resolveComponent("CodeEditorLazy"),
      componentProps: {
        ...componentPropsBase,
        modelValue: ensureString(props.formData[key]),
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
        modelValue: ensureString(props.formData[key]),
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
        modelValue: ensureString(props.formData[key]),
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
        modelValue: ensureNumber(props.formData[key]),
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
          modelValue: ensureString(props.formData[key]),
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
      component: resolveComponent("CodeEditorLazy"),
      componentProps: {
        ...componentPropsBase,
        modelValue: ensureString(props.formData[key]),
        language: config.language || "javascript",
        height: config.height || "300px",
        "onUpdate:modelValue": (val: string) => {
          updateFormData(key, val);
        },
        onDiagnostics: (diags: any[]) => {
          const updated = { ...props.errors };
          if (diags?.length > 0) {
            updated[key] = "Code syntax error";
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
        modelValue: ensureArray(props.formData[key]),
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
          modelValue: ensureString(props.formData[key]),
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
      component: resolveComponent("RichTextEditorLazy"),
      componentProps: {
        modelValue: ensureString(props.formData[key]),
        disabled: disabled,
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

  // Xử lý đặc biệt cho uuid type
  if (finalType === "uuid") {
    return {
      component: resolveComponent("UuidField"),
      componentProps: {
        modelValue: ensureString(props.formData[key]),
        disabled: disabled,
        "onUpdate:modelValue": (val: string) => {
          updateFormData(key, val);
        },
      },
      fieldProps,
    };
  }

  if (finalType === "permission") {
    return {
      component: resolveComponent("FormPermissionInlineEditor"),
      componentProps: {
        modelValue: props.formData[key],
        disabled: disabled,
        "onUpdate:modelValue": (val: any) => {
          updateFormData(key, val);
        },
      },
      fieldProps,
    };
  }

  if (finalType === "date") {
    let modelValue = null;

    if (props.formData[key]) {
      try {
        if (props.formData[key] instanceof Date) {
          const date = props.formData[key];
          if (!isNaN(date.getTime())) {
            // Kiểm tra Date hợp lệ
            modelValue = new CalendarDate(
              date.getFullYear(),
              date.getMonth() + 1,
              date.getDate()
            );
          }
        } else if (typeof props.formData[key] === "string") {
          const date = new Date(props.formData[key]);
          if (!isNaN(date.getTime())) {
            modelValue = new CalendarDate(
              date.getFullYear(),
              date.getMonth() + 1,
              date.getDate()
            );
          }
        } else if (typeof props.formData[key] === "number") {
          const date = new Date(props.formData[key]);
          if (!isNaN(date.getTime())) {
            modelValue = new CalendarDate(
              date.getFullYear(),
              date.getMonth() + 1,
              date.getDate()
            );
          }
        }
      } catch (error) {
        console.error("Error converting to CalendarDate:", error);
        modelValue = null;
      }
    }

    return {
      component: UCalendar,
      componentProps: {
        disabled: disabled,
        class: "w-full",
        modelValue: modelValue,
        placeholder: new CalendarDate(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          new Date().getDate()
        ),
        "onUpdate:modelValue": (val: any) => {
          if (val) {
            try {
              const date = new Date(val.year, val.month - 1, val.day);
              updateFormData(key, date);
            } catch (error) {
              console.error("Error creating Date object:", error);
              updateFormData(key, null);
            }
          } else {
            updateFormData(key, null);
          }
        },
      },
      fieldProps,
    };
  }

  return {
    component: UInput,
    componentProps: {
      ...componentPropsBase,
      type: finalType === "int" ? "number" : "text",
      modelValue: ensureString(props.formData[key]),
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
