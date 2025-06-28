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
const selected = ref("");

function addItem() {
  if (!selected.value) return;
  if (!model.value?.includes(selected.value)) {
    model.value?.push(selected.value);
  }
  selected.value = "";
}

watch(
  () => selected.value,
  () => {
    addItem();
  }
);

function removeItem(item: string) {
  model.value = model.value?.filter((i) => i !== item);
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap gap-2">
      <UBadge
        v-for="item in modelValue"
        :key="item"
        color="primary"
        class="flex items-center gap-1 cursor-pointer"
        trailing-icon="lucide:x"
        @click="removeItem(item)"
        size="lg"
      >
        {{ item }}
      </UBadge>
    </div>

    <div class="flex gap-2">
      <USelect
        v-model="selected"
        :items="props.options"
        placeholder="Chọn giá trị"
        class="flex-1"
        :disabled="disabled"
      />
    </div>
  </div>
</template>
