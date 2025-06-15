<script setup lang="ts">
import { columnTypes, relationTypes } from "~/utils/types/table.type";

const route = useRoute();
const { tables, fetchRoute } = useGlobalState();
const { confirm } = useConfirm();
const toast = useToast();

const tableName = route.params.table as string;
const table = reactive({ ...tables.value.find((t) => t.name === tableName) });

let originalSnapshot = "";

onMounted(() => {
  table.uniques ||= [];
  table.indexes ||= [];
  table.columns ||= [];
  table.relations ||= [];

  for (const col of table.columns) {
    col._editing = false;
    col.error = {};
  }

  for (const rel of table.relations) {
    rel._editing = false;
    rel.error = {};
  }

  originalSnapshot = snapshotTable();
});

function normalize(value: any) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return value;
}

function snapshotTable() {
  const cleanArray = (arr: any[][]) =>
    (arr || [])
      .map((group) => group.filter(Boolean).map(normalize))
      .filter((group) => group.length > 0);

  return JSON.stringify({
    name: normalize(table.name),
    description: normalize(table.description),
    uniques: cleanArray(table.uniques),
    indexes: cleanArray(table.indexes),
    columns: table.columns.map((col: any) => ({
      name: normalize(col.name),
      type: normalize(col.type),
      description: normalize(col.description),
      isIndex: !!col.isIndex,
      isNullable: !!col.isNullable,
    })),
    relations: table.relations.map((rel: any) => ({
      propertyName: normalize(rel.propertyName),
      type: normalize(rel.type),
      targetTable: rel.targetTable ?? null,
      description: normalize(rel.description),
      isIndex: !!rel.isIndex,
      isNullable: !!rel.isNullable,
    })),
  });
}

const isTableChanged = computed(() => snapshotTable() !== originalSnapshot);

const columnNames = computed(() => table.columns.map((col: any) => col.name));
const tableOptions = computed(() =>
  tables.value.map((t) => ({ label: t.name, value: t.id }))
);

function addGroup(list: string[][]) {
  list.push([""]);
}
function addFieldToGroup(list: string[][], groupIndex: number) {
  list[groupIndex].push("");
}
function removeGroup(list: string[][], groupIndex: number) {
  list.splice(groupIndex, 1);
}

function validateColumn(col: any) {
  col.error = {};
  if (!col.isNullable && !col.name?.trim()) {
    col.error.name = "Tên cột là bắt buộc";
  }
  if (!col.type?.trim()) {
    col.error.type = "Phải chọn kiểu dữ liệu";
  }
}

function validateRelation(rel: any) {
  rel.error = {};
  if (!rel.propertyName?.trim()) {
    rel.error.propertyName = "Tên quan hệ là bắt buộc";
  }
  if (!rel.type?.trim()) {
    rel.error.type = "Phải chọn loại quan hệ";
  }
  if (rel.targetTable === null || rel.targetTable === undefined) {
    rel.error.targetTable = "Phải chọn bảng đích";
  }
}

function validateAll() {
  let isValid = true;
  for (const col of table.columns) {
    validateColumn(col);
    if (col.error?.name || col.error?.type) isValid = false;
  }

  for (const rel of table.relations) {
    validateRelation(rel);
    if (rel.error?.propertyName || rel.error?.type || rel.error?.targetTable) {
      isValid = false;
    }
  }

  return isValid;
}

async function save() {
  if (!validateAll()) {
    toast.add({
      title: "Dữ liệu không hợp lệ",
      color: "error",
      description: "Vui lòng kiểm tra lại các trường có lỗi.",
    });
    return;
  }

  const ok = await confirm({
    content: "Bạn chắc chắn muốn sửa cấu trúc bảng?",
  });

  if (!ok) return;

  await patchTable();
}

async function patchTable() {
  const toastId = toast.add({
    title: "Đang xử lý...",
    color: "info",
    description: "Đang cập nhật cấu trúc bảng...",
  });

  const payload = { ...table };
  if (!payload.uniques?.length) delete payload.uniques;
  if (!payload.indexes?.length) delete payload.indexes;

  const { data, error } = await useApi(`/table_definition/${table.id}`, {
    method: "patch",
    body: payload,
  });

  toast.remove(toastId.id);

  if (data.value) {
    await fetchRoute();
    originalSnapshot = snapshotTable();
    toast.add({
      title: "Thành công",
      color: "success",
      description: "Cấu trúc bảng đã được cập nhật!",
    });
  } else if (error.value) {
    toast.add({
      title: "Lỗi",
      color: "error",
      description: error.value?.message,
    });
  }
}
</script>

<template>
  <div class="space-y-6 max-w-[1400px] mx-auto px-4">
    <!-- Header -->
    <UCard class="bg-muted-50 rounded-xl shadow-sm">
      <template #header>
        <div class="space-y-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="text-xl font-semibold text-primary">
                Chỉnh sửa bảng: {{ table.name }}
              </div>
              <UButton
                label="Lưu thay đổi"
                icon="lucide:save"
                color="primary"
                variant="solid"
                @click="save"
                loading-auto
                :disabled="!isTableChanged"
              />
            </div>
            <UTextarea
              v-model="table.description"
              placeholder="Mô tả bảng này"
              autoresize
              variant="subtle"
              class="text-sm w-full"
            />
          </div>
          <!-- Uniques Section -->
          <div class="space-y-4">
            <div
              class="flex items-center gap-2 text-lg font-semibold text-muted"
            >
              <Icon name="lucide:key" class="w-5 h-5" />
              Ràng buộc Unique
              <UButton
                icon="lucide:plus"
                size="sm"
                color="primary"
                @click="addGroup(table.uniques)"
              />
            </div>
            <div
              v-for="(group, gIndex) in table.uniques"
              :key="gIndex"
              class="flex flex-wrap gap-2 items-center"
            >
              <USelectMenu
                v-for="(field, fIndex) in group"
                :key="fIndex"
                :items="
                  columnNames.filter((name:string) => {
                    return group[fIndex] === name || !group.includes(name);
                  })
                "
                v-model="table.uniques[gIndex][fIndex]"
                size="sm"
                class="min-w-[180px]"
              />

              <UButton
                icon="lucide:plus"
                size="xs"
                @click="addFieldToGroup(table.uniques, gIndex)"
              />
              <UButton
                icon="lucide:trash"
                color="error"
                variant="ghost"
                size="xs"
                @click="removeGroup(table.uniques, gIndex)"
              />
            </div>
          </div>

          <!-- Indexes Section -->
          <div class="space-y-4 mt-8">
            <div
              class="flex items-center gap-2 text-lg font-semibold text-muted"
            >
              <Icon name="lucide:list" class="w-5 h-5" />
              Chỉ mục (Index)
              <UButton
                icon="lucide:plus"
                size="sm"
                color="primary"
                @click="addGroup(table.indexes)"
              />
            </div>
            <div
              v-for="(group, gIndex) in table.indexes"
              :key="gIndex"
              class="flex flex-wrap gap-2 items-center"
            >
              <USelectMenu
                v-for="(field, fIndex) in group"
                :key="fIndex"
                :items="
                  columnNames.filter((name:string) => {
                    return group[fIndex] === name || !group.includes(name);
                  })
                "
                v-model="table.indexes[gIndex][fIndex]"
                size="sm"
                class="min-w-[180px]"
              />

              <UButton
                icon="lucide:plus"
                size="xs"
                @click="addFieldToGroup(table.indexes, gIndex)"
              />
              <UButton
                icon="lucide:trash"
                color="error"
                variant="ghost"
                size="xs"
                @click="removeGroup(table.indexes, gIndex)"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- COLUMNS -->
      <div class="divide-y divide-muted rounded-xl border border-muted mt-6">
        <div
          v-for="(column, index) in table.columns"
          :key="column.id ?? index"
          class="p-4 space-y-4"
        >
          <!-- Hàng 1: name, type, id, isIndex -->
          <div class="flex flex-wrap gap-4 items-start">
            <UFormField :error="column.error?.name" required>
              <UInput
                v-model="column.name"
                placeholder="Tên cột"
                icon="lucide:type"
                :disabled="column.isSystem"
                size="md"
                class="max-w-[200px] flex-1"
                :error="!!column.error?.name"
                :color="column.error?.name ? 'error' : undefined"
              />
            </UFormField>

            <!-- ✅ USelect with error + color -->
            <UFormField :error="column.error?.type" required>
              <USelect
                v-model="column.type"
                :items="columnTypes"
                option-attribute="value"
                value-attribute="value"
                placeholder="Kiểu dữ liệu"
                :disabled="column.isSystem"
                size="md"
                class="max-w-[160px] flex-1"
                :error="!!column.error?.type"
                :color="column.error?.type ? 'error' : undefined"
              />
            </UFormField>

            <!-- ID -->
            <div class="text-sm text-gray-400 font-mono mt-2 min-w-[80px]">
              #{{ column.id ?? "mới" }}
            </div>

            <!-- isIndex toggle -->
            <div class="flex items-center gap-2 mt-2">
              <USwitch
                v-model="column.isIndex"
                :disabled="column.isSystem"
                size="sm"
              />
              <span class="text-sm text-muted">Chỉ mục</span>
            </div>
            <!-- isNullable -->
            <div class="flex items-center gap-2 mt-2">
              <USwitch
                v-model="column.isNullable"
                :disabled="column.isSystem"
                size="sm"
              />
              <span class="text-sm text-muted">Cho phép null</span>
            </div>
          </div>

          <!-- Hàng 2: Mô tả -->
          <div>
            <div
              class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-primary transition"
              @click="column._editing = true"
              v-if="!column._editing"
            >
              <Icon name="lucide:edit-3" class="w-4 h-4" />
              <span>{{ column.description || "Nhấn để thêm mô tả..." }}</span>
            </div>
            <div v-else class="space-y-2">
              <UTextarea
                v-model="column.description"
                placeholder="Mô tả cột này"
                autoresize
                variant="subtle"
                class="text-sm w-full"
              />
              <div class="flex justify-end gap-2">
                <UButton
                  icon="lucide:check"
                  size="xs"
                  variant="solid"
                  color="primary"
                  @click="column._editing = false"
                />
                <UButton
                  icon="lucide:x"
                  size="xs"
                  variant="solid"
                  color="error"
                  @click="column._editing = false"
                />
              </div>
            </div>
          </div>

          <!-- Hàng 3: Xoá -->
          <div class="flex justify-end">
            <UButton
              icon="lucide:trash"
              size="md"
              variant="solid"
              color="error"
              :disabled="column.isSystem"
              @click="table.columns.splice(index, 1)"
            />
          </div>
        </div>

        <!-- Thêm cột -->
        <div class="p-4 flex justify-end">
          <UButton
            icon="lucide:plus"
            label="Thêm cột"
            @click="
              table.columns.push({
                name: '',
                type: 'varchar',
                description: '',
                isSystem: false,
                isIndex: false,
                _editing: false,
                error: {},
              })
            "
          />
        </div>
      </div>

      <!-- RELATIONS -->
      <div class="divide-y divide-muted rounded-xl border border-muted mt-6">
        <div
          v-for="(rel, index) in table.relations"
          :key="rel.id ?? index"
          class="p-4 space-y-4"
        >
          <!-- Hàng 1: propertyName, type, targetTable, isIndex -->
          <div class="flex flex-wrap gap-4 items-start">
            <UFormField :error="rel.error?.propertyName" required>
              <UInput
                v-model="rel.propertyName"
                placeholder="Tên quan hệ"
                icon="lucide:link"
                :disabled="rel.isSystem"
                size="md"
                class="max-w-[200px] flex-1"
                :error="!!rel.error?.propertyName"
                :color="rel.error?.propertyName ? 'error' : undefined"
              />
            </UFormField>

            <UFormField :error="rel.error?.type" required>
              <USelect
                v-model="rel.type"
                :items="relationTypes"
                option-attribute="value"
                value-attribute="value"
                placeholder="Loại quan hệ"
                :disabled="rel.isSystem"
                size="md"
                class="max-w-[160px] flex-1"
                :error="!!rel.error?.type"
                :color="rel.error?.type ? 'error' : undefined"
              />
            </UFormField>

            <UFormField :error="rel.error?.targetTable" required>
              <USelect
                v-model="rel.targetTable"
                :items="tableOptions"
                placeholder="Bảng đích"
                :disabled="rel.isSystem"
                size="md"
                class="max-w-[240px] flex-1"
                :error="!!rel.error?.targetTable"
                :color="rel.error?.targetTable ? 'error' : undefined"
              />
            </UFormField>

            <!-- Chỉ mục -->
            <div
              v-if="rel.type === 'many-to-one'"
              class="flex items-center gap-2 mt-2"
            >
              <USwitch
                v-model="rel.isIndex"
                :disabled="rel.isSystem"
                size="sm"
              />
              <span class="text-sm text-muted">Chỉ mục</span>
            </div>

            <!-- Cho phép null (relation) -->
            <div class="flex items-center gap-2 mt-2">
              <USwitch
                v-model="rel.isNullable"
                :disabled="rel.isSystem"
                size="sm"
              />
              <span class="text-sm text-muted">Cho phép null</span>
            </div>
          </div>

          <!-- Hàng 2: mô tả -->
          <div>
            <div
              class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-primary transition"
              @click="rel._editing = true"
              v-if="!rel._editing"
            >
              <Icon name="lucide:edit-3" class="w-4 h-4" />
              <span>{{ rel.description || "Nhấn để thêm mô tả..." }}</span>
            </div>
            <div v-else class="space-y-2">
              <UTextarea
                v-model="rel.description"
                placeholder="Mô tả quan hệ này"
                autoresize
                variant="subtle"
                class="text-sm w-full"
              />
              <div class="flex justify-end gap-2">
                <UButton
                  icon="lucide:check"
                  size="xs"
                  variant="solid"
                  color="primary"
                  @click="rel._editing = false"
                />
                <UButton
                  icon="lucide:x"
                  size="xs"
                  variant="solid"
                  color="error"
                  @click="rel._editing = false"
                />
              </div>
            </div>
          </div>

          <!-- Hàng 3: Xoá -->
          <div class="flex justify-end">
            <UButton
              icon="lucide:trash"
              size="md"
              variant="solid"
              color="error"
              :disabled="rel.isSystem"
              @click="table.relations.splice(index, 1)"
            />
          </div>
        </div>

        <!-- Thêm quan hệ -->
        <div class="p-4 flex justify-end">
          <UButton
            icon="lucide:plus"
            label="Thêm quan hệ"
            @click="
              table.relations.push({
                propertyName: '',
                type: 'many-to-one',
                targetTable: null,
                description: '',
                isSystem: false,
                isIndex: false,
                _editing: false,
                error: {},
              })
            "
          />
        </div>
      </div>
    </UCard>
  </div>
</template>
