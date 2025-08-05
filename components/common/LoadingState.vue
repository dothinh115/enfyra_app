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
      return "w-16 h-16";
    case "lg":
      return "w-24 h-24";
    default:
      return "w-20 h-20";
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
  <div class="flex flex-col items-center justify-center py-8 gap-4">
    <!-- Modern Spinner -->
    <div class="relative">
      <!-- Outer ring with glow -->
      <div
        :class="`${spinnerSize} border-4 border-primary/10 rounded-full shadow-lg`"
      ></div>
      <!-- Spinning ring -->
      <div
        :class="`absolute inset-0 ${spinnerSize} border-4 border-transparent border-t-primary rounded-full animate-spin`"
        style="animation-duration: 1s"
      ></div>
      <!-- Inner pulse -->
      <div
        :class="`absolute ${
          spinnerSize === 'w-16 h-16'
            ? 'inset-4'
            : spinnerSize === 'w-24 h-24'
            ? 'inset-6'
            : 'inset-5'
        } bg-primary/20 rounded-full animate-pulse`"
      ></div>
    </div>

    <div class="text-center">
      <p :class="`${textSize} font-medium text-foreground`">
        {{ props.title || defaultTitle }}
      </p>
      <p
        v-if="props.description"
        :class="`${textSize} text-sm text-muted-foreground mt-1`"
      >
        {{ props.description }}
      </p>
    </div>
  </div>
</template>
