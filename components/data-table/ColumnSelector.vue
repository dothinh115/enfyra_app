<script setup lang="ts">
interface Props {
  items: Array<{
    label: string;
    type: "checkbox";
    checked: boolean;
    onSelect: (e: Event) => void;
  }>;
}

const props = defineProps<Props>();
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