<script setup lang="ts">
const props = defineProps<{
  relationMeta: any;
  modelValue: any;
}>();
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
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
    <UFormField
      :label="relationMeta.propertyName"
      class="rounded-lg border border-muted p-4"
    >
      <template #description>
        <span
          class="block min-h-[1.25rem] text-xs text-muted-foreground italic"
        >
          {{ relationMeta.description || "" }}
        </span>
      </template>

      <div class="flex flex-wrap gap-2 items-center">
        <UBadge
          v-for="item in selectedIds"
          :key="item.id"
          size="lg"
          color="primary"
          variant="soft"
          class="flex items-center gap-1"
        >
          {{ item.id }}
          <button
            @click.stop="removeId(item.id)"
            class="ml-1 text-xs hover:text-red-500"
            title="Xoá"
          >
            ✕
          </button>
        </UBadge>

        <UButton
          icon="lucide:pencil"
          size="sm"
          variant="outline"
          color="secondary"
          @click="showModal = true"
          class="rounded-full"
        />
      </div>

      <UModal v-model:open="showModal">
        <template #body>
          <RelationSelectorTable
            :relationMeta="relationMeta"
            :selected-ids="selectedIds"
            :multiple="relationMeta.type === 'many-to-many'"
            @apply="applySelection"
          />
        </template>
      </UModal>
    </UFormField>
  </div>
</template>
