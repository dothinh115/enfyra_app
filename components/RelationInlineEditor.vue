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
    selectedIds.value = Array.isArray(props.modelValue)
      ? props.modelValue
      : props.modelValue
      ? [props.modelValue]
      : [];
  },
  { immediate: true }
);

function applySelection(ids: any[]) {
  emit(
    "update:modelValue",
    props.relationMeta.type === "many-to-one" ? ids[0] : ids
  );
  showModal.value = false;
}

function removeId(id: any) {
  if (props.relationMeta.type === "many-to-one") {
    emit("update:modelValue", null);
    selectedIds.value = [];
  } else {
    const updated = selectedIds.value.filter((i) => i.id !== id);
    emit("update:modelValue", updated);
    selectedIds.value = updated;
  }
}

function shortenId(id: string | number): string {
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
      color="primary"
      variant="soft"
      class="flex items-center gap-1"
    >
      {{ shortenId(item.id) }}
      <button
        @click.stop="removeId(item.id)"
        class="ml-1 text-xs hover:text-red-500 cursor-pointer"
        title="Xoá"
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
