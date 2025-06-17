<script setup lang="ts">
import { columnTypes } from "~/utils/types/table.type";
const props = defineProps<{
  modelValue: any[];
}>();

const isEditing = ref(false);
const editingIndex = ref<number | null>(null);
const currentColumn = ref<any>(null);
const { columns: columnData, tables } = useGlobalState();
const columns = useModel(props, "modelValue");
const isNew = ref(false);
const route = useRoute();

function createEmptyColumn(): any {
  const tableName = route.params.table as string;
  const table = tables.value.find((t) => t.name === tableName);
  const column: any = {};
  column.error = {};
  column.name = "";
  column.type = "varchar";
  if (!table) return column;

  const omit = ["id", "createdAt", "updatedAt", "table"];

  for (const def of columnData?.value) {
    if (def.table !== table.id) continue;
    if (omit.includes(def.name)) continue;

    column[def.name] =
      def.default !== null && def.default !== undefined
        ? def.default
        : def.type === "boolean"
        ? false
        : def.type === "simple-json"
        ? {}
        : def.type === "text" || def.type === "varchar"
        ? ""
        : def.type === "enum"
        ? def.enumValues?.[0] ?? ""
        : def.type === "int"
        ? 0
        : null;
  }
  column.name = "";
  column.type = "varchar";
  column._editing = false;
  column.error = {};
  return column;
}

function editColumn(col: any, index: number) {
  isEditing.value = true;

  if (!col) return;
  editingIndex.value = index;
  currentColumn.value = { ...toRaw(col) };
}

function saveColumn() {
  validate();
  if (Object.keys(currentColumn.value.error).length > 0) return;

  const newCol = { ...currentColumn.value };

  if (isNew.value) {
    columns.value.push(newCol);
  } else if (editingIndex.value != null) {
    columns.value.splice(editingIndex.value, 1, newCol);
  }

  isEditing.value = false;
  isNew.value = false;
  currentColumn.value = null;
  editingIndex.value = null;
}

function addNewColumn() {
  isNew.value = true;
  isEditing.value = true;
  currentColumn.value = createEmptyColumn();
  editingIndex.value = null;
}

watch(
  () => [currentColumn.value?.name, currentColumn.value?.type],
  (newVal, oldVal) => {
    for (let i = 0; i < newVal.length; i++) {
      if (oldVal[i] === undefined) continue;
      if (newVal[i]) validate();
    }
  }
);
function validate() {
  const errors: Record<string, string> = {};

  if (!currentColumn.value?.name?.trim()) {
    errors.name = "Tên cột là bắt buộc";
  } else if (!tableNameOrFieldRegexCheck.test(currentColumn.value?.name)) {
    errors.name =
      "Chỉ cho phép chữ cái, số, _ và không bắt đầu bằng số hoặc _!";
  } else {
    delete errors.name;
  }
  if (!currentColumn.value?.type) {
    errors.type = "Phải chọn kiểu dữ liệu";
  } else {
    delete errors.type;
  }
  if (currentColumn.value) currentColumn.value.error = errors;
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2 text-lg font-semibold text-muted">
      <Icon name="lucide:columns" class="w-5 h-5" />
      Cột
    </div>
    <div
      v-for="(column, index) in columns"
      :key="column.id ?? index"
      class="flex items-center justify-between rounded-lg border border-muted hover:bg-muted/50 transition"
    >
      <!-- Phần click để chỉnh sửa -->
      <div
        class="flex items-center gap-2 flex-1 cursor-pointer px-4 py-3"
        @click="editColumn(column, index)"
      >
        <Icon name="lucide:type" class="w-4 h-4 text-muted-foreground" />
        <span class="text-sm font-medium">
          {{ column.name || "Chưa đặt tên" }}
        </span>

        <UBadge size="xs" color="info" v-if="column.type">
          {{ column.type }}
        </UBadge>
        <UBadge size="xs" color="info" v-if="column.isNullable"
          >nullable</UBadge
        >
        <UBadge size="xs" color="info" v-if="column.isIndex">index</UBadge>
      </div>

      <!-- Nút xoá -->
      <UButton
        icon="lucide:trash"
        color="error"
        variant="ghost"
        size="xs"
        :disabled="column.isSystem || column.isPrimary"
        class="hover:cursor-pointer mr-2"
        @click.stop="columns.splice(index, 1)"
      />
    </div>

    <!-- Thêm cột -->
    <div class="flex justify-end pt-2">
      <UButton icon="lucide:plus" label="Thêm cột" @click="addNewColumn()" />
    </div>
  </div>

  <!-- Modal sửa cột -->
  <Teleport to="body">
    <UModal
      v-model:open="isEditing"
      v-if="currentColumn"
      close-icon="i-lucide-arrow-right"
    >
      <!-- Header modal -->
      <template #header>
        <div class="flex justify-between items-center w-full">
          <div class="text-base font-semibold">
            Sửa cột: {{ currentColumn?.name || "Cột mới" }}
          </div>
          <UButton
            icon="lucide:x"
            color="error"
            variant="soft"
            @click="isEditing = false"
          >
            Huỷ
          </UButton>
        </div>
      </template>

      <!-- Body modal -->
      <template #body>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Tên cột" :error="currentColumn.error?.name">
            <UInput
              v-model="currentColumn.name"
              placeholder="Tên cột"
              :error="currentColumn.error?.name"
            />
          </UFormField>

          <UFormField label="Kiểu dữ liệu" :error="currentColumn.error?.type">
            <USelect
              v-model="currentColumn.type"
              :items="columnTypes"
              placeholder="Chọn kiểu dữ liệu"
            />
          </UFormField>

          <div class="flex items-center gap-2">
            <USwitch v-model="currentColumn.isNullable" />
            <span class="text-sm text-muted">Cho phép null</span>
          </div>

          <div class="flex items-center gap-2">
            <USwitch v-model="currentColumn.isIndex" />
            <span class="text-sm text-muted">Chỉ mục</span>
          </div>

          <!-- Boolean: chọn true/false -->
          <UFormField
            v-if="currentColumn.type === 'boolean'"
            label="Giá trị mặc định"
            class="md:col-span-2 flex items-center space-x-2"
          >
            <USelect
              v-model="currentColumn.default"
              :items="[
                { label: 'true', value: true },
                { label: 'false', value: false },
                { label: 'Không đặt', value: null },
              ]"
              placeholder="Chọn giá trị mặc định"
            />
          </UFormField>

          <!-- Giá trị mặc định cho text -->
          <UFormField
            v-else-if="currentColumn.type === 'text'"
            label="Giá trị mặc định"
            class="md:col-span-2"
          >
            <UTextarea
              v-model="currentColumn.default"
              placeholder="Giá trị mặc định"
              autoresize
              class="w-full"
            />
          </UFormField>

          <!-- Giá trị mặc định cho varchar, int -->
          <UFormField
            v-else-if="['varchar', 'int'].includes(currentColumn.type)"
            label="Giá trị mặc định"
            class="md:col-span-2"
          >
            <UInput
              v-model="currentColumn.default"
              class="w-full"
              placeholder="Giá trị mặc định"
              :type="currentColumn.type === 'int' ? 'number' : 'string'"
            />
          </UFormField>
          <UFormField label="Placeholder" class="md:col-span-2">
            <UInput
              v-model="currentColumn.placeholder"
              placeholder="Placeholder"
              class="md:col-span-2 w-full"
            />
          </UFormField>
          <UFormField label="Mô tả cho cột này" class="md:col-span-2">
            <UTextarea
              v-model="currentColumn.description"
              placeholder="..."
              class="w-full"
            />
          </UFormField>
        </div>
      </template>

      <!-- Footer modal -->
      <template #footer>
        <div class="flex w-full px-4 pb-4 space-x-2 justify-end">
          <UButton
            icon="lucide:check"
            label="Lưu"
            @click="saveColumn()"
            color="primary"
            :disabled="currentColumn.isSystem"
          />
        </div>
      </template>
    </UModal>
  </Teleport>
</template>
