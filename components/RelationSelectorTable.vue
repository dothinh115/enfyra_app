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
const data = ref();
const { schemas } = useGlobalState();

watch(
  () => props.selectedIds,
  () => {
    selected.value = [...props.selectedIds];
  }
);

const { tables } = useGlobalState();
let targetTable = tables.value.find(
  (t) => t.id === props.relationMeta.targetTable.id
);

async function fetchData() {
  const { data: item } = await useApiLazy(`/${targetTable?.name}`, {
    query: {
      fields: "*",
      page: page.value,
      limit,
      meta: "totalCount",
    },
  });
  data.value = item.value;
}

watch(
  () => showModal.value,
  async (val) => {
    if (val) {
      page.value = 1;
      await fetchData();
    }
  }
);

watch(
  () => page.value,
  async () => {
    await fetchData();
  }
);

watch(
  () => data.value,
  () => {
    total.value = data.value?.meta?.totalCount || 0;
  }
);

onMounted(async () => {
  await fetchData();
});

function toggle(id: any) {
  if (props.multiple) {
    if (selected.value.find((sel) => sel.id === id)) {
      selected.value = selected.value.filter((i) => i.id !== id);
    } else {
      selected.value.push({ id });
    }
  } else {
    selected.value = [{ id }];
  }
}

function isSelected(id: any) {
  return selected.value.some((sel) => sel.id === id);
}

function apply() {
  console.log(selected.value);
  emit("apply", selected.value);
  showModal.value = false;
}

function getDisplayLabel(item: Record<string, any>): string {
  const keys = Object.keys(item);
  if (keys.length === 0) return `ID: ${item.id}`;

  // Ưu tiên theo name, title, propertyName
  const preferred = keys.find(
    (k) => ["name", "title", "propertyName"].includes(k) && k !== "id"
  );
  if (preferred && item[preferred]) return item[preferred];

  // Nếu không có ưu tiên → lấy field đầu tiên khác id
  const fallback = keys.find((k) => k !== "id");
  if (fallback && item[fallback]) return item[fallback];

  // Nếu không có gì hết
  return `ID: ${item.id}`;
}
</script>

<template>
  <div class="space-y-4">
    <!-- Danh sách chọn -->

    <UButton
      v-for="item in data?.data || []"
      :key="item.id"
      class="w-full px-4 py-3 hover:bg-muted transition flex items-center justify-between cursor-pointer"
      @click="toggle(item.id)"
      variant="outline"
      :color="isSelected(item.id) ? 'primary' : 'neutral'"
    >
      <div class="overflow-hidden">
        ID: {{ item.id }} -
        <span class="truncate"> {{ getDisplayLabel(item) }}</span>
      </div>

      <Icon
        v-if="isSelected(item.id)"
        name="lucide:check"
        class="w-4 h-4 text-primary shrink-0"
      />
    </UButton>

    <!-- Footer modal -->
    <div class="flex items-center justify-between pt-2">
      <div class="text-xs text-muted-foreground">
        Page {{ page }} / {{ Math.ceil(total / limit) || 1 }}
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
          Apply
        </UButton>
      </div>
    </div>
  </div>
</template>
