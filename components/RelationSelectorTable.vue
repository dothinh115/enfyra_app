<script setup lang="ts">
const props = defineProps<{
  relationMeta: any;
  selectedIds: any[];
  multiple?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits(["apply"]);
const selected = ref<any[]>([...props.selectedIds]);
const page = ref(1);
const limit = 10;
const total = ref(0);
const showModal = ref(true);
const data = ref();
const showCreateDrawer = ref(false);
const createForm = ref<Record<string, any>>({});
const creating = ref(false);
const createErrors = ref<Record<string, string>>({});

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

function validateCreateForm(): boolean {
  const errors: Record<string, string> = {};
  let isValid = true;

  const columnMap = new Map<string, any>();
  const definition = schemas.value[targetTable?.name]?.definition || [];
  for (const field of definition) {
    const key = field.name || field.propertyName;
    if (key) columnMap.set(key, field);
  }

  for (const key of Object.keys(createForm.value)) {
    const field = columnMap.get(key);
    const value = createForm.value[key];
    const nullable = field?.isNullable ?? true;

    const empty =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "");

    if (!nullable && empty) {
      errors[key] = "Trường này là bắt buộc";
      isValid = false;
    }
  }

  createErrors.value = errors;
  return isValid;
}

async function createNewRecord() {
  if (!targetTable?.name) return;
  if (!validateCreateForm()) return;

  creating.value = true;
  try {
    const { data } = await useApiLazy(`/${targetTable.name}`, {
      method: "post",
      body: createForm.value,
    });

    selected.value.push({ id: data.value.data[0].id });
    await fetchData();
    showCreateDrawer.value = false;
    createForm.value = {};
    createErrors.value = {};
  } catch (e: any) {
    console.error("Failed to create", e);
  } finally {
    creating.value = false;
  }
}

function initCreateForm() {
  if (!targetTable?.name) return;
  const definition = schemas.value[targetTable.name]?.definition || [];

  const initial: Record<string, any> = {};

  for (const field of definition) {
    const key = field.name || field.propertyName;
    if (
      !key ||
      ["id", "createdAt", "updatedAt"].includes(field.name) ||
      field.fieldType !== "column"
    )
      continue;

    // Khởi tạo theo type
    switch (field.type) {
      case "boolean":
        initial[key] = false;
        break;
      case "array":
      case "int":
        initial[key] = 0;
        break;
      default:
        initial[key] = "";
    }
  }

  createForm.value = initial;
}

watch(showCreateDrawer, (val) => {
  if (val) initCreateForm();
});

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
  if (props.disabled) return;
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
  if (props.disabled) return;
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
    <div>
      <UButton
        icon="lucide:plus"
        block
        variant="soft"
        color="primary"
        class="w-full"
        @click="showCreateDrawer = true"
        :disabled="props.disabled"
      >
        Thêm bản ghi mới
      </UButton>
    </div>
    <UButton
      v-for="item in data?.data || []"
      :key="item.id"
      class="w-full px-4 py-3 hover:bg-muted transition flex items-center justify-between cursor-pointer"
      @click="toggle(item.id)"
      variant="outline"
      :color="isSelected(item.id) ? 'primary' : 'neutral'"
      :class="{
        '!cursor-not-allowed': props.disabled,
      }"
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
      <div class="text-xs text-muted-foreground flex items-center gap-2">
        Page {{ page }} / {{ Math.ceil(total / limit) || 1 }}
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
      </div>
      <UButton
        icon="lucide:check"
        @click="apply"
        color="primary"
        size="sm"
        :disabled="props.disabled"
      >
        Apply
      </UButton>
    </div>
  </div>
  <Teleport to="body">
    <UDrawer
      v-model:open="showCreateDrawer"
      direction="right"
      class="min-w-xl"
      inset
      :ui="{
        header:
          'border-b border-muted text-muted pb-2 flex justify-between items-center',
      }"
    >
      <template #header>
        <h2>
          {{ `New ${targetTable.name}` }}
        </h2>
        <UButton
          @click="showCreateDrawer = false"
          icon="lucide:x"
          color="error"
          variant="ghost"
          size="xl"
        />
      </template>
      <template #body>
        <div class="space-y-4">
          <DynamicFormEditor
            v-model="createForm"
            :table-name="targetTable?.name"
            :errors="createErrors"
          />
          <div class="flex justify-end gap-2 border-t border-muted pt-2">
            <UButton
              icon="lucide:plus"
              color="primary"
              @click="createNewRecord"
              :loading="creating"
            >
              Tạo mới
            </UButton>
          </div>
        </div>
      </template>
    </UDrawer>
  </Teleport>
</template>
