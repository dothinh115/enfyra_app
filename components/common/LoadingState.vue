<script setup lang="ts">
const props = defineProps<{
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}>();

const defaultTitle = "Loading...";
const defaultDescription = "Please wait while we fetch your data";
const defaultSize = "md";

const spinnerSize = computed(() => {
  switch (props.size || defaultSize) {
    case "sm":
      return "w-6 h-6";
    case "lg":
      return "w-12 h-12";
    default:
      return "w-8 h-8";
  }
});

const textSize = computed(() => {
  switch (props.size || defaultSize) {
    case "sm":
      return "text-sm";
    case "lg":
      return "text-lg";
    default:
      return "text-base";
  }
});
</script>

<template>
  <div class="flex flex-col items-center justify-center py-8 gap-3">
    <div class="relative">
      <div
        :class="`${spinnerSize.value} border-2 border-primary/20 rounded-full`"
      ></div>
      <div
        :class="`absolute inset-0 ${spinnerSize.value} border-2 border-transparent border-t-primary rounded-full animate-spin`"
      ></div>
    </div>
    <div class="text-center">
      <p :class="`${textSize.value} font-medium text-foreground`">
        {{ props.title || defaultTitle }}
      </p>
      <p
        v-if="props.description"
        :class="`${textSize.value} text-sm text-muted-foreground mt-1`"
      >
        {{ props.description }}
      </p>
    </div>
  </div>
</template>
