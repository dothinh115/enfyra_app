<template>
  <div class="space-y-4">
    <!-- Danh sách chọn -->

    <UButton
      v-for="item in data?.data || []"
      :key="item.id"
      class="w-full text-left px-4 py-3 hover:bg-muted transition flex items-center justify-between cursor-pointer"
      @click="toggle(item.id)"
      variant="outline"
      :color="isSelected(item.id) ? 'primary' : 'neutral'"
    >
      <div>
        <div class="text-xs text-muted-foreground">ID: {{ item.id }}</div>
      </div>
      <Icon
        v-if="isSelected(item.id)"
        name="lucide:check"
        class="w-4 h-4 text-primary"
      />
    </UButton>
    <!-- Footer modal -->
    <div class="flex items-center justify-between pt-2">
      <div class="text-xs text-muted-foreground">
        Trang {{ page }} / {{ Math.ceil(total / limit) || 1 }}
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          size="xs"
          variant="ghost"
          :disabled="page <= 1"
          @click="page--"
        />
        <UButton
          icon="i-lucide-chevron-right"
          size="xs"
          variant="ghost"
          :disabled="page >= Math.ceil(total / limit)"
          @click="page++"
        />
        <UButton icon="lucide:check" @click="apply" color="primary" size="sm">
          Áp dụng
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  relationMeta: any;
  selectedIds: any[];
  multiple?: boolean;
}>();

const emit = defineEmits(["apply"]);

const selected = ref<any[]>([...props.selectedIds]);
const page = ref(1);
const limit = 10;
const total = ref(0);
const showModal = ref(true);

watch(
  () => props.selectedIds,
  () => {
    selected.value = [...props.selectedIds];
  }
);

const { tables } = useGlobalState();

const targetTable = computed(() =>
  tables.value.find((t) => t.id === props.relationMeta.targetTable.id)
);

const {
  data,
  pending,
  refresh: fetchRecords,
} = await useApiLazy(`/${targetTable.value?.name}`, {
  query: {
    fields: "*",
    page: page.value,
    limit,
    meta: "totalCount",
  },
});

watch(showModal, (val) => {
  if (val) {
    page.value = 1;
    fetchRecords();
  }
});

watch(page, () => {
  fetchRecords();
});

watch(data, () => {
  total.value = data.value?.meta?.totalCount || 0;
});

function toggle(id: any) {
  if (props.multiple) {
    if (selected.value.includes(id)) {
      selected.value = selected.value.filter((i) => i !== id);
    } else {
      selected.value.push(id);
    }
  } else {
    selected.value = [id];
  }
}

function isSelected(id: any) {
  return selected.value.includes(id);
}

function apply() {
  emit("apply", selected.value);
  showModal.value = false;
}
</script>
