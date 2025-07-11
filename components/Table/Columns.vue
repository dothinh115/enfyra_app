<script setup lang="ts">
import { columnTypes } from "~/utils/types/table.type";

const props = defineProps<{
  modelValue: any[];
}>();

const isEditing = ref(false);
const editingIndex = ref<number | null>(null);
const currentColumn = ref<any>(null);
const { tables } = useGlobalState();
const columns = useModel(props, "modelValue");
const isNew = ref(false);
const errors = ref<Record<string, string>>({});

function createEmptyColumn(): any {
  const columnDefTable = tables.value.find(
    (t) => t.name === "column_definition"
  );
  if (!columnDefTable) {
    console.error("Không tìm thấy bảng column_definition!");
    return {};
  }

  const column: any = {};

  for (const def of columnDefTable.columns.sort(
    (a: any, b: any) => a.id - b.id
  )) {
    // Tính default cho từng type
    let value;
    if (def.defaultValue !== null && def.defaultValue !== undefined) {
      value = def.defaultValue;
    } else if (def.type === "boolean") {
      value = false;
    } else if (def.type === "simple-json") {
      value = null;
    } else if (def.type === "text" || def.type === "varchar") {
      value = null;
    } else if (def.type === "enum") {
      value = def.enumValues?.[0] ?? "";
    } else if (def.type === "int") {
      value = 0;
    } else {
      value = null;
    }

    column[def.name] = value;
  }
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
  validate("name");
  if (Object.keys(errors.value).length > 0) return;

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
  currentColumn.value.isNullable = true;
  currentColumn.value.isUpdatable = true;
  editingIndex.value = null;
  delete currentColumn.value.id;
}

function validate(property?: string) {
  if (property === "name") {
    if (!currentColumn.value?.name?.trim()) {
      errors.value.name = "Tên cột là bắt buộc";
    } else if (!tableNameOrFieldRegexCheck.test(currentColumn.value?.name)) {
      errors.value.name =
        "Chỉ cho phép chữ cái, số, _ và không bắt đầu bằng số hoặc _!";
    } else {
      delete errors.value.name;
    }
    return;
  }

  if (!currentColumn.value?.type) {
    errors.value.type = "Phải chọn kiểu dữ liệu";
  } else delete errors.value.type;

  if (
    !currentColumn.value?.isNullable &&
    !currentColumn.value?.isGenerated &&
    !currentColumn.value?.defaultValue
  ) {
    errors.value.defaultValue = "Không được để trống!";
  } else delete errors.value.defaultValue;
}

onMounted(() => {
  const primaryColumn = createEmptyColumn();
  primaryColumn.name = "id";
  primaryColumn.type = "int";
  primaryColumn.isPrimary = true;
  primaryColumn.isGenerated = true;
  primaryColumn.isNullable = false;
  delete primaryColumn.id;
  if (!columns.value.length) columns.value.push(primaryColumn);
});
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
            {{ editingIndex !== null ? "Sửa cột: " : "" }}
            {{ currentColumn?.name || "Cột mới" }}
          </div>
          <UButton
            icon="lucide:x"
            color="error"
            variant="soft"
            @click="
              isEditing = false;
              currentColumn = null;
            "
          >
            Huỷ
          </UButton>
        </div>
      </template>

      <!-- Body modal -->
      <template #body>
        <DynamicFormEditor
          v-model="currentColumn"
          tableName="column_definition"
          :errors="errors"
          :includes="currentColumn.name === 'id' ? ['name', 'type'] : undefined"
          :excluded="[
            'isSystem',
            'id',
            'enumValues',
            'createdAt',
            'updatedAt',
            'isPrimary',
          ]"
          :type-map="{
            type: {
              type: 'select',
              options:
                currentColumn.name === 'id'
                  ? columnTypes.filter((colType) =>
                      ['uuid', 'int'].includes(colType.value)
                    )
                  : columnTypes,
            },
            name: {
              disabled: currentColumn.name === 'id',
            },
          }"
        />
      </template>

      <!-- Footer modal -->
      <template #footer>
        <div class="flex w-full space-x-2 justify-end">
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
