<script setup lang="ts">
const emit = defineEmits(["update:modelValue"]);

const model = defineModel<any[]>();

const props = defineProps<{
  options: Record<string, any>[];
  labelKey: string;
  valueKey: string;
  disabled?: boolean;
}>();

const input = ref("");

if (!Array.isArray(model.value)) {
  model.value = [];
}

function addItem() {
  const val = input.value.trim();
  if (val && !model.value?.includes(val)) {
    model.value?.push(val);
  }
  input.value = "";
}

function removeItem(item: string) {
  model.value = model.value?.filter((i) => i !== item);
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex gap-2 flex-wrap">
      <UBadge
        v-for="item in model"
        :key="item"
        color="primary"
        class="flex items-center gap-1"
      >
        {{ item }}
        <button @click="removeItem(item)" class="ml-1 text-xs">✕</button>
      </UBadge>
    </div>
    <div class="flex gap-2">
      <UInput
        v-model="input"
        placeholder="Add value"
        class="flex-1"
        @keyup.enter="addItem"
      />
      <UButton icon="lucide:plus" @click="addItem" />
    </div>
  </div>
</template>
