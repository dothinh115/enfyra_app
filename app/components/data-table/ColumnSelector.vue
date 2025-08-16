<script setup lang="ts">
import type { ColumnSelectorProps } from "../../utils/types";

const props = defineProps<ColumnSelectorProps>();
</script>

<template>
  <UDropdownMenu
    :items="items"
    popper="{ placement: 'bottom-end' }"
  >
    <template #default>
      <UButton icon="i-lucide-columns" size="sm" variant="soft">
        Columns
      </UButton>
    </template>
  </UDropdownMenu>
</template>