<script setup lang="ts">
const props = defineProps<{
  page: number;
  total: number;
  limit: number;
  loading: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:page": [page: number];
  apply: [];
}>();

const totalPages = computed(() => Math.ceil(props.total / props.limit) || 1);

function goToPage(newPage: number) {
  if (newPage >= 1 && newPage <= totalPages.value) {
    emit("update:page", newPage);
  }
}

function apply() {
  if (props.disabled) return;
  emit("apply");
}
</script>

<template>
  <div class="flex justify-between pt-2">
    <div class="text-xs text-muted-foreground flex gap-2 items-center">
      Page {{ page }} / {{ totalPages }}
      <UButton
        icon="i-lucide-chevron-left"
        size="xs"
        @click="goToPage(page - 1)"
        :disabled="page <= 1 || loading"
      />
      <UButton
        icon="i-lucide-chevron-right"
        size="xs"
        @click="goToPage(page + 1)"
        :disabled="page >= totalPages || loading"
      />
    </div>
    <UButton
      icon="lucide:check"
      @click="apply"
      color="primary"
      size="sm"
      :disabled="disabled"
    >
      Apply
    </UButton>
  </div>
</template>
