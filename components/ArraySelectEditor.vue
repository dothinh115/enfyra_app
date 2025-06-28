<script setup lang="ts">
const props = defineProps<{
  options: string[];
  disabled?: boolean;
}>();

const model = defineModel<any[]>();
if (!Array.isArray(model.value)) {
  model.value = [];
}
const emit = defineEmits(["update:modelValue"]);
const selectedArr = ref<string[]>(model.value);

function addItem() {
  model.value = selectedArr.value as any;
}

watch(
  () => selectedArr.value,
  () => {
    addItem();
  }
);
</script>

<template>
  <div class="space-y-2">
    <div class="flex gap-2">
      <USelectMenu
        v-model="selectedArr"
        :items="props.options"
        placeholder="Chọn giá trị"
        class="flex-1"
        :disabled="disabled"
        multiple
      />
    </div>
  </div>
</template>
