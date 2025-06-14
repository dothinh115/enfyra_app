<script setup lang="ts">
const { isVisible, options, onCancel, onConfirm } = useConfirm();
</script>

<template>
  <UModal v-model:open="isVisible" prevent-close>
    <template #title>
      <div class="text-lg font-semibold">{{ options.title }}</div>
    </template>
    <template #body>
      <div class="p-6 space-y-4">
        <p class="text-sm text-gray-300 text-center">
          {{ options.content }}
        </p>

        <div class="flex justify-center gap-2 pt-4">
          <UButton variant="ghost" @click="onCancel">
            {{ options.cancelText }}
          </UButton>
          <UButton @click="onConfirm">
            {{ options.confirmText }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
