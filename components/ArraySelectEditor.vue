<script setup lang="ts">
const props = defineProps<{
  options: string[];
  disabled?: boolean;
  multiple?: boolean;
}>();

const model = defineModel<any[]>();
if (!Array.isArray(model.value)) {
  model.value = [];
}
const emit = defineEmits(["update:modelValue"]);
const selected = ref("");
const selectedArr = ref<string[]>([]);

const proxySelected = computed({
  get() {
    return props.multiple ? selectedArr.value : selected.value;
  },
  set(val) {
    if (props.multiple) selectedArr.value = val as string[];
    else selected.value = val as string;
  },
});

function addItem() {
  if (!proxySelected.value) return;
  if (!props.multiple && !model.value?.includes(selected.value)) {
    model.value?.push(selected.value);
  }
  if (props.multiple) {
    model.value = proxySelected.value as any;
    console.log(model.value);
  }
  selected.value = "";
}

watch(
  () => proxySelected.value,
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
    <div class="flex flex-wrap gap-2" v-if="modelValue?.length">
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
        v-model="proxySelected"
        :items="props.options"
        placeholder="Chọn giá trị"
        class="flex-1 text-transparent caret-transparent"
        :disabled="disabled"
        :multiple="props.multiple"
      />
    </div>
  </div>
</template>
