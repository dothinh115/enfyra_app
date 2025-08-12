<script setup lang="ts">
// UInput, USelect, UButton auto-imported by Nuxt
import type { FilterCondition, FilterGroup } from "~/utils/common/filter/FilterTypes";
// getOperatorsByType, mapDbTypeToFilterType, needsValue, needsTwoValues auto-imported from utils
// getCombinedOptionsForContext, getFieldOptions auto-imported from utils

const props = defineProps<{
  condition: FilterCondition;
  parentGroup: FilterGroup;
  conditionIndex: number;
  schemas: Record<string, any>;
  tableName: string;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  "update:condition": [condition: FilterCondition];
  "convert-to-group": [group: FilterGroup, index: number];
  remove: [index: number];
}>();

function updateCondition() {
  emit("update:condition", { ...props.condition });
}

function onFieldSelectChange(selectedValue: string) {
  const options = getCombinedOptionsForContext(props.tableName, props.schemas);
  const selectedOption = options.find((opt) => opt.value === selectedValue);

  if (!selectedOption) return;

  if (selectedOption.fieldCategory === "column") {
    // Set field path - include relation prefix if in relation context
    const fieldPath = props.parentGroup.relationContext
      ? `${props.parentGroup.relationContext}.${selectedValue}`
      : selectedValue;

    props.condition.field = fieldPath;
    props.condition.type = mapDbTypeToFilterType(
      selectedOption.fieldType || "string"
    );
    props.condition.operator =
      getOperatorsByType(props.condition.type)[0]?.value || "_eq";
    props.condition.value = null;
    updateCondition();
  } else if (selectedOption.fieldCategory === "relation") {
    // Emit event to convert to group
    const newRelationContext = props.parentGroup.relationContext
      ? `${props.parentGroup.relationContext}.${selectedValue}`
      : selectedValue;

    const newGroup: FilterGroup = {
      id: Math.random().toString(36).substring(2, 9),
      operator: "and",
      relationContext: newRelationContext,
      conditions: [
        {
          id: Math.random().toString(36).substring(2, 9),
          field: "",
          operator: "_eq",
          value: null,
          type: "string",
        },
      ],
    };

    emit("convert-to-group", newGroup, props.conditionIndex);
  }
}
</script>

<template>
  <div class="flex items-center gap-2 p-3 border border-muted rounded-lg">
    <!-- Field Select -->
    <div v-if="!readonly" class="flex items-center gap-2">
      <USelect
        :model-value="
          condition.field.includes('.')
            ? condition.field.split('.').pop()
            : condition.field
        "
        :items="getCombinedOptionsForContext(tableName, schemas)"
        @update:model-value="(val) => onFieldSelectChange(val as string)"
        :placeholder="
          parentGroup.relationContext
            ? 'Select field from ' + parentGroup.relationContext
            : 'Select field or relation'
        "
        class="min-w-40"
      />
    </div>
    <span v-else class="text-sm font-medium min-w-32">{{
      condition.field
    }}</span>

    <!-- Operator Select -->
    <USelect
      v-if="!readonly"
      v-model="condition.operator"
      :items="getOperatorsByType(condition.type || 'string')"
      @update:model-value="updateCondition"
      class="min-w-32"
    />
    <span v-else class="text-sm min-w-32">
      {{
        getOperatorsByType(condition.type || "string").find(
          (op) => op.value === condition.operator
        )?.label
      }}
    </span>

    <!-- Value Input(s) -->
    <template v-if="needsValue(condition.operator)">
      <!-- Boolean Select -->
      <USelect
        v-if="!readonly && condition.type === 'boolean'"
        v-model="condition.value"
        :items="[
          { label: 'True', value: true },
          { label: 'False', value: false },
        ]"
        @update:model-value="updateCondition"
        class="min-w-24"
      />

      <!-- Select with Options -->
      <USelect
        v-else-if="
          !readonly &&
          condition.type === 'select' &&
          ['_in', '_not_in'].includes(condition.operator)
        "
        v-model="condition.value"
        :items="getFieldOptions(condition.field, tableName, schemas)"
        multiple
        @update:model-value="updateCondition"
        class="min-w-32"
      />

      <USelect
        v-else-if="!readonly && condition.type === 'select'"
        v-model="condition.value"
        :items="getFieldOptions(condition.field, tableName, schemas)"
        @update:model-value="updateCondition"
        class="min-w-24"
      />

      <!-- Between Values -->
      <div
        v-else-if="!readonly && needsTwoValues(condition.operator)"
        class="flex items-center gap-1"
      >
        <UInput
          :model-value="condition.value?.[0] || ''"
          @update:model-value="
            (val) => {
              condition.value = [val, condition.value?.[1] || ''];
              updateCondition();
            }
          "
          :type="
            condition.type === 'number'
              ? 'number'
              : condition.type === 'date'
              ? 'date'
              : 'text'
          "
          size="sm"
          class="w-24"
        />
        <span class="text-xs text-gray-500">and</span>
        <UInput
          :model-value="condition.value?.[1] || ''"
          @update:model-value="
            (val) => {
              condition.value = [condition.value?.[0] || '', val];
              updateCondition();
            }
          "
          :type="
            condition.type === 'number'
              ? 'number'
              : condition.type === 'date'
              ? 'date'
              : 'text'
          "
          size="sm"
          class="w-24"
        />
      </div>

      <!-- Single Value -->
      <UInput
        v-else-if="!readonly"
        v-model="condition.value"
        @update:model-value="updateCondition"
        :type="
          condition.type === 'number'
            ? 'number'
            : condition.type === 'date'
            ? 'date'
            : 'text'
        "
        size="sm"
        class="min-w-32"
      />

      <!-- Readonly Value Display -->
      <span v-else class="text-sm">
        <template v-if="needsTwoValues(condition.operator)">
          {{ condition.value?.[0] }} - {{ condition.value?.[1] }}
        </template>
        <template v-else-if="Array.isArray(condition.value)">
          {{ condition.value.join(", ") }}
        </template>
        <template v-else>
          {{ condition.value }}
        </template>
      </span>
    </template>

    <!-- Remove Button -->
    <UButton
      v-if="!readonly"
      @click="emit('remove', conditionIndex)"
      icon="lucide:x"
      size="xs"
      color="error"
      variant="ghost"
    />
  </div>
</template>
