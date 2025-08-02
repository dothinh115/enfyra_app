<script setup lang="ts">
declare global {
  interface Window {
    tinymce: any;
  }
}
const props = defineProps<{
  modelValue: string | null;
  disabled?: boolean;
  height?: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
}>();

const textareaId = `tinymce-${Math.random().toString(36).slice(2)}`;
const editorRef = ref<any>(null);

function loadTinyMCE(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.tinymce) return resolve();

    const s = document.createElement("script");
    s.src = "/tinymce/tinymce.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("TinyMCE load failed"));
    document.head.appendChild(s);
  });
}

onMounted(async () => {
  await loadTinyMCE();

  window.tinymce.init({
    selector: `#${textareaId}`,
    skin_url: "/tinymce/skins/ui/oxide-dark",
    content_css: "/tinymce/skins/content/dark/content.css",
    icons_url: "/tinymce/icons/default/icons.min.js",
    plugins: ["link", "lists", "code", "table"],
    skin: "oxide-dark",
    external_plugins: {
      link: "/tinymce/plugins/link/plugin.min.js",
      lists: "/tinymce/plugins/lists/plugin.min.js",
      code: "/tinymce/plugins/code/plugin.min.js",
      table: "/tinymce/plugins/table/plugin.min.js",
    },
    toolbar:
      "undo redo  | bold italic underline | " +
      "bullist numlist | link table | code",
    menubar: false,
    height: props.height ?? 300,
    readonly: props.disabled ?? false,
    license_key: "gpl",
    setup(editor: any) {
      editorRef.value = editor;

      editor.on("init", () => {
        editor.setContent(props.modelValue || "");
      });

      editor.on("Change KeyUp Undo Redo", () => {
        emit("update:modelValue", editor.getContent());
      });
    },
  });
});

watch(
  () => props.modelValue,
  (v) => {
    if (editorRef.value && v !== editorRef.value.getContent()) {
      editorRef.value.setContent(v || "");
    }
  }
);

onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy();
    editorRef.value = null;
  }
});
</script>

<template>
  <!-- TinyMCE will "take over" this textarea -->
  <textarea :id="textareaId"></textarea>
</template>

<style lang="scss">
.tox .tox-edit-area::before {
  border: none !important;
}
</style>
