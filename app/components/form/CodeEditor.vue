<script setup lang="ts">
const props = defineProps<{
  modelValue?: string;
  language?: "javascript" | "vue" | "json" | "html";
  height?: string;
}>();

const emit = defineEmits(["update:modelValue", "diagnostics"]);

// Use composables for clean separation of concerns
const { customTheme, syntaxHighlighting: syntaxHighlightingExtension } = useCodeMirrorTheme(props.height);
const { getLanguageExtension, basicSetup } = useCodeMirrorExtensions();
const { editorRef, createEditor, watchExtensions, destroyEditor } = useCodeMirrorEditor({
  modelValue: props.modelValue,
  language: props.language,
  height: props.height,
  emit
});

// Language extension
const languageExtension = computed(() => getLanguageExtension(props.language));

// Editor extensions
const extensions = computed(() => [
  ...basicSetup,
  languageExtension.value,
  syntaxHighlightingExtension(),
  customTheme.value,
]);

onMounted(() => {
  createEditor(extensions.value);
  watchExtensions(extensions);
});

onUnmounted(() => {
  destroyEditor();
});

// Emit empty diagnostics for compatibility
watch(() => props.language, () => {
  emit("diagnostics", []);
});
</script>

<template>
  <div class="rounded-md overflow-hidden ring-1 ring-slate-700">
    <div ref="editorRef" class="codemirror-editor" />
  </div>
</template>

<style scoped>
.codemirror-editor {
  font-family: "Fira Code", "JetBrains Mono", monospace;
}
</style>