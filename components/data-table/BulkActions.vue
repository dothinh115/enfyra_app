<script setup lang="ts">
import type { BulkActionsProps } from "~/utils/types";

const props = defineProps<BulkActionsProps>();
</script>

<template>
  <div v-if="selectedCount > 0" class="flex items-center gap-2">
    <span class="text-sm text-gray-600 dark:text-gray-400">
      {{ selectedCount }} selected
    </span>
    <UButton
      v-if="onDelete"
      icon="i-lucide-trash-2"
      size="sm"
      color="error"
      variant="solid"
      @click.stop="onDelete"
    >
      Delete Selected
    </UButton>
  </div>
</template>