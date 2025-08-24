<script setup lang="ts">
// Vue functions are auto-imported
import {
  UInput,
  UTextarea,
  USwitch,
  USelect,
  FormDateField,
} from "#components";

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

  // Handle special cases first
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

  // Switch case for different field types
  switch (finalType) {
    case "boolean":
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

    case "select":
    case "enum": {
      // Get options from config or from schema options
      let items = config.options ?? [];

      // If no options provided and field type is enum, get from schema
      if (items.length === 0) {
        const column = props.columnMap.get(key);
        if (column?.type === "enum" && column?.options) {
          items = column.options.map((opt: string) => ({
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

    case "array":
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

    case "simple-json":
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
        component: resolveComponent("FormCodeEditorLazy"),
        componentProps: {
          ...componentPropsBase,
          modelValue: ensureString(props.formData[key]),
          language: "json",
          height: config.height || "300px",
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

    case "text":
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

    case "textarea":
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

    case "number":
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

    case "code":
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
        component: resolveComponent("FormCodeEditorLazy"),
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

    case "array-select":
      const schemaOptions = column?.options || [];
      const finalOptions = config.options || schemaOptions;

      return {
        component: resolveComponent("FormArraySelectEditor"),
        componentProps: {
          ...componentPropsBase,
          options: finalOptions,
          modelValue: ensureArray(props.formData[key]),
          "onUpdate:modelValue": (val: string[]) => {
            updateFormData(key, val);
          },
        },
        fieldProps,
      };

    case "array-tags":
      return {
        component: resolveComponent("FormArraySelectDisplay"),
        componentProps: {
          ...componentPropsBase,
          modelValue: ensureString(props.formData[key]),
          "onUpdate:modelValue": (val: string) => {
            updateFormData(key, val);
          },
        },
        fieldProps,
      };

    case "richtext":
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
        component: resolveComponent("FormRichTextEditorLazy"),
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

    case "uuid":
      return {
        component: resolveComponent("FormUuidField"),
        componentProps: {
          modelValue: ensureString(props.formData[key]),
          disabled: disabled,
          isPrimary: column?.isPrimary || false,
          "onUpdate:modelValue": (val: string) => {
            updateFormData(key, val);
          },
        },
        fieldProps,
      };

    case "permission":
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

    case "date": {
      return {
        component: FormDateField,
        componentProps: {
          disabled: disabled,
          modelValue: props.formData[key],
          "onUpdate:modelValue": (val: Date | null) => {
            updateFormData(key, val);
          },
        },
        fieldProps,
      };
    }

    case "int":
      return {
        component: UInput,
        componentProps: {
          ...componentPropsBase,
          type: "number",
          modelValue: ensureString(props.formData[key]),
          "onUpdate:modelValue": (val: string) => {
            updateFormData(key, val);
          },
        },
        fieldProps,
      };

    // Default case for text input
    default:
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
        fieldProps,
      };
  }
}

const componentConfig = computed(() => getComponentConfigByKey(props.keyName));
</script>

<template>
  <component
    :is="componentConfig.component"
    v-bind="componentConfig.componentProps"
  />
</template>
