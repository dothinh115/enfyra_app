<script setup lang="ts">
import { relationTypes } from "~/utils/types/table.type";
import { useModel } from "#imports";

const props = defineProps<{
  modelValue: any[];
  tableOptions: { label: string; value: any }[];
}>();

const relations = useModel(props, "modelValue");
const { relations: relationData } = useGlobalState();

const isEditing = ref(false);
const isNew = ref(false);
const editingIndex = ref<number | null>(null);
const currentRelation = ref<any>(null);

function createEmptyRelation(): any {
  const base = relationData.value.find((r) => r.propertyName !== "id") ?? {};
  const omit = ["id", "createdAt", "updatedAt", "table"];
  const relation: any = {};

  for (const key in base) {
    if (!omit.includes(key)) {
      const value = base[key];
      relation[key] =
        typeof value === "boolean"
          ? false
          : value === null || value === undefined
          ? ""
          : Array.isArray(value)
          ? []
          : typeof value === "object"
          ? { ...value }
          : "";
    }
  }

  relation.propertyName = "";
  relation.type = "many-to-one";
  relation.targetTable = null;
  relation.isIndex = false;
  relation.isNullable = false;
  relation.description = "";
  relation.isSystem = false;
  delete relation.sourceTable;
  return relation;
}

function openNewRelationModal() {
  isEditing.value = true;
  isNew.value = true;
  editingIndex.value = null;
  currentRelation.value = createEmptyRelation();
}

function editRelation(rel: any, index: number) {
  isEditing.value = true;
  isNew.value = false;
  editingIndex.value = index;
  currentRelation.value = { ...toRaw(rel), error: {} };
}

function validateRelation(rel: any) {
  const error: Record<string, string> = {};

  if (!rel.propertyName?.trim()) {
    error.propertyName = "Tên quan hệ là bắt buộc";
  } else if (!tableNameOrFieldRegexCheck.test(rel.propertyName)) {
    error.propertyName =
      "Chỉ cho phép chữ cái, số, _ và không bắt đầu bằng số hoặc _!";
  }

  if (!rel.type) {
    error.type = "Phải chọn loại quan hệ";
  }

  if (!rel.targetTable) {
    error.targetTable = "Phải chọn bảng đích";
  }

  rel.error = error;
  return error;
}

function saveRelation() {
  const rel = currentRelation.value;
  const errors = validateRelation(rel);
  if (Object.keys(errors).length > 0) return;

  const newRel = { ...rel };

  if (isNew.value) {
    relations.value.push(newRel);
  } else if (editingIndex.value != null) {
    relations.value.splice(editingIndex.value, 1, newRel);
  }

  isEditing.value = false;
  currentRelation.value = null;
}
</script>

<template>
  <div class="space-y-2 mt-6">
    <div class="flex items-center gap-2 text-lg font-semibold text-muted">
      <Icon name="lucide:git-branch" class="w-5 h-5" />
      Quan hệ
    </div>

    <div
      v-for="(rel, index) in relations"
      :key="rel.id ?? index"
      class="flex items-center justify-between rounded-lg border border-muted hover:bg-muted/50 transition"
    >
      <div
        class="flex items-center gap-2 flex-1 cursor-pointer px-4 py-3"
        @click="editRelation(rel, index)"
      >
        <Icon name="lucide:link" class="w-4 h-4 text-muted-foreground" />
        <span class="text-sm font-medium">
          {{ rel.propertyName || "Chưa đặt tên" }}
        </span>

        <UBadge size="xs" color="info" v-if="rel.type">{{ rel.type }}</UBadge>
        <UBadge size="xs" color="info" v-if="rel.targetTable">
          →
          {{
            props.tableOptions.find((t) => t.value === rel.targetTable)
              ?.label ?? rel.targetTable
          }}
        </UBadge>
        <UBadge size="xs" color="info" v-if="rel.isNullable">nullable</UBadge>
        <UBadge size="xs" color="info" v-if="rel.isIndex">index</UBadge>
      </div>

      <UButton
        icon="lucide:trash"
        color="error"
        variant="ghost"
        size="xs"
        :disabled="rel.isSystem"
        class="hover:cursor-pointer mr-2"
        @click.stop="relations.splice(index, 1)"
      />
    </div>

    <div class="flex justify-end pt-2">
      <UButton
        icon="lucide:plus"
        label="Thêm quan hệ"
        @click="openNewRelationModal()"
      />
    </div>
  </div>

  <!-- Modal sửa quan hệ -->
  <Teleport to="body">
    <UModal v-model:open="isEditing" v-if="currentRelation">
      <template #header>
        <div class="flex justify-between items-center w-full">
          <div class="text-base font-semibold">
            {{ isNew ? "Thêm quan hệ" : "Sửa quan hệ" }}
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

      <template #body>
        <DynamicFormEditor
          v-model="currentRelation"
          tableName="relation_definition"
          :errors="currentRelation?.error"
          :excluded="[
            'id',
            'createdAt',
            'updatedAt',
            'table',
            'sourceTable',
            'isSystem',
            'isEager',
            'isInverseEager',
          ]"
          :type-map="{
            targetTable: {
              type: 'select',
              options: tableOptions,
            },
            type: {
              type: 'select',
              options: relationTypes,
            },
          }"
        />
      </template>

      <template #footer>
        <div class="flex w-full px-4 pb-4 space-x-2 justify-end">
          <UButton
            icon="lucide:check"
            label="Lưu"
            @click="saveRelation()"
            color="primary"
            :disabled="currentRelation.isSystem"
          />
        </div>
      </template>
    </UModal>
  </Teleport>
</template>
