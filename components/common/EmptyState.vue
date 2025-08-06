<script setup lang="ts">
const props = defineProps<{
  title?: string;
  description?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
  size?: "sm" | "md" | "lg";
}>();

const defaultTitle = "No data available";
const defaultDescription = "There are no items to display at the moment";
const defaultIcon = "lucide:database";
const defaultSize = "md";

const iconSize = computed(() => {
  switch (props.size || defaultSize) {
    case "sm":
      return "w-8 h-8";
    case "lg":
      return "w-16 h-16";
    default:
      return "w-12 h-12";
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
    <Icon
      :name="props.icon || defaultIcon"
      :class="`${iconSize} text-muted-foreground`"
    />
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
    <UButton
      v-if="props.action"
      :icon="props.action.icon"
      @click="props.action.onClick"
      size="sm"
      variant="soft"
      color="primary"
    >
      {{ props.action.label }}
    </UButton>
  </div>
</template>
