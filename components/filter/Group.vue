<script setup lang="ts">
// USelect, UButton auto-imported by Nuxt
import type {
  FilterGroup as FilterGroupType,
  FilterCondition,
} from "~/utils/filter/FilterTypes";
// generateId auto-imported from utils
// getTargetTableNameForGroup auto-imported from utils

const props = defineProps<{
  group: FilterGroupType;
  schemas: Record<string, any>;
  tableName: string;
  rootTableName?: string;
  readonly?: boolean;
}>();
const emit = defineEmits<{
  "update:group": [group: FilterGroupType];
  remove: [];
}>();

function updateGroup() {
  emit("update:group", { ...props.group });
}

function addCondition() {
  const newCondition: FilterCondition = {
    id: generateId(),
    field: "",
    operator: "_eq",
    value: null,
    type: "string",
  };
  props.group.conditions.push(newCondition);
  updateGroup();
}

function addGroup() {
  const newGroup: FilterGroupType = {
    id: generateId(),
    operator: "and",
    conditions: [],
  };
  props.group.conditions.push(newGroup);
  updateGroup();
}

function removeItem(index: number) {
  props.group.conditions.splice(index, 1);
  updateGroup();
}

function onConditionUpdate(condition: FilterCondition, index: number) {
  props.group.conditions[index] = condition;
  updateGroup();
}

function onConvertToGroup(newGroup: FilterGroupType, index: number) {
  props.group.conditions[index] = newGroup;
  updateGroup();
}

function onNestedGroupUpdate(group: FilterGroupType, index: number) {
  props.group.conditions[index] = group;
  updateGroup();
}

function isCondition(
  item: FilterCondition | FilterGroupType
): item is FilterCondition {
  return "field" in item;
}
</script>

<template>
  <div class="space-y-4">
    <!-- Group Operator -->
    <div class="flex items-center gap-2" v-if="group.conditions.length > 1">
      <USelect
        v-if="!readonly"
        v-model="group.operator"
        :items="[
          { label: 'AND', value: 'and' },
          { label: 'OR', value: 'or' },
        ]"
        @update:model-value="updateGroup"
        size="xs"
        class="w-20"
      />
      <span v-else class="text-xs px-2 py-1 bg-gray-100 rounded">
        {{ group.operator.toUpperCase() }}
      </span>
    </div>

    <div class="space-y-2 pl-4 border-l-2 border-muted">
      <template v-for="(item, index) in group.conditions" :key="item.id">
        <!-- Filter Condition -->
        <FilterCondition
          v-if="isCondition(item)"
          :condition="item"
          :parent-group="group"
          :condition-index="index"
          :schemas="schemas"
          :table-name="tableName"
          :readonly="readonly"
          @update:condition="(condition) => onConditionUpdate(condition, index)"
          @convert-to-group="(newGroup, idx) => onConvertToGroup(newGroup, idx)"
          @remove="removeItem"
        />

        <!-- Nested Filter Group -->
        <div v-else class="border border-muted rounded-lg p-3">
          <!-- Show relation context if this is a relation group -->
          <div
            v-if="item.relationContext"
            class="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-700"
          >
            <span class="font-medium">Filtering in relation:</span>
            {{ item.relationContext }}
            <span class="text-gray-500"
              >({{
                getTargetTableNameForGroup(
                  item,
                  schemas,
                  rootTableName || tableName
                )
              }})</span
            >
          </div>

          <FilterGroup
            :group="item"
            :schemas="schemas"
            :table-name="
              getTargetTableNameForGroup(
                item,
                schemas,
                rootTableName || tableName
              )
            "
            :root-table-name="rootTableName || tableName"
            :readonly="readonly"
            @update:group="(g) => onNestedGroupUpdate(g, index)"
            @remove="() => removeItem(index)"
          />

          <UButton
            v-if="!readonly"
            @click="removeItem(index)"
            icon="lucide:x"
            size="xs"
            color="error"
            variant="ghost"
            class="mt-2"
          >
            Remove Group
          </UButton>
        </div>
      </template>

      <!-- Add Actions -->
      <div v-if="!readonly" class="flex gap-2">
        <UButton
          @click="addCondition"
          icon="lucide:plus"
          size="xs"
          variant="soft"
        >
          Add Filter
        </UButton>
        <UButton
          @click="addGroup"
          icon="lucide:layers"
          size="xs"
          variant="soft"
        >
          Add Group
        </UButton>
      </div>
    </div>
  </div>
</template>
