<template>
  <img :src="imageSrc" :alt="alt" :class="imageClass" :loading="loading" />
</template>

<script setup lang="ts">
interface Props {
  src: string;
  alt?: string;
  class?: string;
  loading?: "lazy" | "eager";
}

const props = withDefaults(defineProps<Props>(), {
  alt: "",
  class: "",
  loading: "lazy",
});

// Convert assets path to /api/assets/... for backend proxy
const imageSrc = computed(() => {
  if (props.src.startsWith("/assets/")) {
    return props.src.replace("/assets/", "/api/assets/");
  }
  if (props.src.startsWith("assets/")) {
    return props.src.replace("assets/", "/api/assets/");
  }
  return props.src;
});

// Combine class props
const imageClass = computed(() => props.class);
</script>
