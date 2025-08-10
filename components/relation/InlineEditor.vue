<script setup lang="ts">
const props = defineProps<{
  relationMeta: any;
  modelValue: any;
  disabled?: boolean;
  allowDelete?: boolean;
}>();
defineOptions({ inheritAttrs: false });

const emit = defineEmits(["update:modelValue"]);
const showModal = ref(false);
const selectedIds = ref<any[]>([]);
watch(
  () => props.modelValue,
  () => {
    // Xử lý selectedIds dựa trên loại relation
    if (
      props.relationMeta.type === "one-to-one" ||
      props.relationMeta.type === "many-to-one"
    ) {
      // One-to-One và Many-to-One: modelValue là object {id: 1}
      selectedIds.value =
        props.modelValue && props.modelValue.id ? [props.modelValue] : [];
    } else {
      // One-to-Many và Many-to-Many: modelValue là array [{id: 1}]
      selectedIds.value = Array.isArray(props.modelValue)
        ? props.modelValue.filter((item) => item && item.id) // Chỉ lấy items có id
        : [];
    }
  },
  { immediate: true }
);

function applySelection(ids: any[]) {
  // Xử lý theo loại relation
  let result;
  switch (props.relationMeta.type) {
    case "one-to-one":
    case "many-to-one":
      // One-to-One và Many-to-One: trả về object {id: 1}
      result = ids.length > 0 ? ids[0] : null;
      break;
    case "one-to-many":
    case "many-to-many":
      // One-to-Many và Many-to-Many: trả về array [{id: 1}]
      result = ids;
      break;
    default:
      result = ids;
  }

  emit("update:modelValue", result);
  showModal.value = false;
}

function removeId(id: any) {
  // Kiểm tra id có hợp lệ không
  if (id === undefined || id === null) {
    console.warn("Cannot remove item with undefined/null id:", id);
    return;
  }

  if (
    props.relationMeta.type === "one-to-one" ||
    props.relationMeta.type === "many-to-one"
  ) {
    // One-to-One và Many-to-One: emit null
    emit("update:modelValue", null);
    selectedIds.value = [];
  } else {
    // One-to-Many và Many-to-Many: emit array rỗng
    const updated = selectedIds.value.filter((i) => i.id !== id);
    emit("update:modelValue", updated);
    selectedIds.value = updated;
  }
}

function shortenId(id: string | number): string {
  if (id === undefined || id === null) {
    return "Invalid ID";
  }
  const str = String(id);
  return str.length <= 6 ? str : `${str.slice(0, 4)}...`;
}
</script>

<template>
  <div class="flex flex-wrap gap-2 items-center">
    <UBadge
      v-for="item in selectedIds"
      :key="item.id"
      size="lg"
      :color="item.id ? 'primary' : 'error'"
      variant="soft"
      class="flex items-center gap-1"
    >
      {{ item.id ? shortenId(item.id) : "Invalid ID" }}
      <button
        @click.stop="removeId(item.id)"
        class="ml-1 text-xs hover:text-red-500 cursor-pointer"
        title="Delete"
        v-if="!props.disabled"
      >
        ✕
      </button>
    </UBadge>

    <UButton
      icon="lucide:pencil"
      size="md"
      variant="outline"
      color="secondary"
      @click="showModal = true"
      class="rounded-full"
    />
  </div>
  <Teleport to="body">
    <UDrawer
      v-model:open="showModal"
      direction="right"
      class="min-w-xl"
      :ui="{
        header:
          'border-b border-muted text-muted pb-2 flex items-center justify-between',
      }"
    >
      <template #header>
        <h2>
          {{ props.relationMeta.propertyName }}
        </h2>
        <UButton
          @click="showModal = false"
          icon="lucide:x"
          color="error"
          variant="ghost"
          size="xl"
        />
      </template>
      <template #body>
        <RelationSelector
          :relationMeta="relationMeta"
          :selected-ids="selectedIds"
          :multiple="
            relationMeta.type === 'many-to-many' ||
            relationMeta.type === 'one-to-many'
          "
          @apply="applySelection"
          :disabled="props.disabled"
          :allowDelete
        />
      </template>
    </UDrawer>
  </Teleport>
</template>
