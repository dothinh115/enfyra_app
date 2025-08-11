<template>
  <div class="flex items-center gap-2">
    <UInput
      :model-value="modelValue || ''"
      :placeholder="placeholder"
      :disabled="disabled"
      class="flex-1 font-mono text-sm"
      readonly
    />
    <UButton
      icon="lucide:refresh-cw"
      color="primary"
      variant="solid"
      size="lg"
      @click="generateNewUuid"
      title="Generate new UUID"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

function generateNewUuid() {
  const newUuid = crypto.randomUUID();

  emit("update:modelValue", newUuid);
}
</script>
