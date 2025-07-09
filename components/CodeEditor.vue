<script setup lang="ts">
import { javascript } from "@codemirror/lang-javascript";

const props = defineProps<{
  modelValue: string | undefined;
  language?: string;
}>();

const emit = defineEmits(["update:modelValue"]);
const code = ref(props.modelValue ?? "");
watch(
  () => code.value,
  (newVal) => {
    emit("update:modelValue", newVal);
  }
);

const extensions = [javascript(), ctxAutocomplete];
</script>

<template>
  <NuxtCodeMirror
    v-model="code"
    :extensions="extensions"
    theme="dark"
    height="400px"
    basicSetup
    :editable="true"
    :readOnly="false"
  />
</template>
