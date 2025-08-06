<script setup lang="ts">
import { relationTypes } from "~/utils/types/table.type";
import { useModel } from "#imports";

const props = defineProps<{
  modelValue: any[];
  tableOptions: { label: string; value: any }[];
}>();

const relations = useModel(props, "modelValue");

const isEditing = ref(false);
const isNew = ref(false);
const editingIndex = ref<number | null>(null);
const currentRelation = ref<any>(null);
const relationErrors = ref<Record<number, Record<string, string>>>({});

const { generateEmptyForm, validate } = useSchema("relation_definition");

function createEmptyRelation(): any {
  return generateEmptyForm();
}

const currentRelationErrors = computed({
  get: () => relationErrors.value[editingIndex.value ?? relations.value.length] || {},
  set: (val) => {
    relationErrors.value[editingIndex.value ?? relations.value.length] = val;
  }
});

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
  currentRelation.value = { ...toRaw(rel) };
}


function saveRelation() {
  const rel = currentRelation.value;
  const index = editingIndex.value ?? relations.value.length;
  const { isValid, errors } = validate(rel);

  if (!isValid) {
    relationErrors.value[index] = errors;
    return;
  }

  delete relationErrors.value[index];

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
      Relations
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
          {{ rel.propertyName || "Unnamed" }}
        </span>

        <UBadge size="xs" color="info" v-if="rel.type">{{ rel.type }}</UBadge>
        <UBadge size="xs" color="info" v-if="rel.targetTable">
          →
          {{
            props.tableOptions.find((t) => t.value === rel.targetTable)
              ?.label ?? rel.targetTable.id
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
        label="Add Relation"
        @click.stop="openNewRelationModal()"
        class="relative z-10"
        color="primary"
        variant="solid"
      />
    </div>
  </div>

  <!-- Edit Relation Modal -->
  <Teleport to="body">
    <UModal v-model:open="isEditing" v-if="currentRelation">
      <template #header>
        <div class="flex justify-between items-center w-full">
          <div class="text-base font-semibold">
            {{ isNew ? "Add Relation" : "Edit Relation" }}
          </div>
          <UButton
            icon="lucide:x"
            color="error"
            variant="soft"
            @click="isEditing = false"
          >
            Cancel
          </UButton>
        </div>
      </template>

      <template #body>
        <FormEditor
          v-model="currentRelation"
          v-model:errors="currentRelationErrors"
          tableName="relation_definition"
          :excluded="[
            'id',
            'createdAt',
            'updatedAt',
            'isSystem',
            'isEager',
            'isInverseEager',
            'sourceTable',
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
            label="Save"
            @click="saveRelation()"
            color="primary"
          />
        </div>
      </template>
    </UModal>
  </Teleport>
</template>
