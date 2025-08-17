<script setup lang="ts">
import type { ColumnSelectorProps } from "../../utils/types";

interface Props extends ColumnSelectorProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "solid" | "outline" | "ghost" | "soft";
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
  variant: "soft"
});
</script>

<template>
  <UDropdownMenu
    :items="items"
    popper="{ placement: 'bottom-end' }"
  >
    <template #default>
      <UButton icon="i-lucide-columns" :size="size" :variant="variant">
        Columns
      </UButton>
    </template>
  </UDropdownMenu>
</template>