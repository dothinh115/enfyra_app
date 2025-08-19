<script setup lang="ts">
// UInput, USelect, UButton auto-imported by Nuxt
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

// Date picker modal state
const showDateModal = ref(false);
const tempDateValue = ref(null);
const datePickerMode = ref<'single' | 'from' | 'to'>('single');

// Array input state
const arrayDisplayValue = computed({
  get: () => {
    if (Array.isArray(props.condition.value)) {
      return props.condition.value.join(', ');
    }
    return '';
  },
  set: (value) => {
    parseArrayInput(value);
  }
});

function updateCondition() {
  emit("update:condition", { ...props.condition });
}

// Helper functions
function formatDate(date: string | Date): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function getArrayPlaceholder(type: string): string {
  return type === 'number' ? '1, 2, 3' : 'value1, value2, value3';
}

function getInputType(type: string): string {
  return type === 'number' ? 'number' : 'text';
}

function getInputPlaceholder(operator: string, type: string): string {
  if (operator === '_contains') return 'Contains text...';
  if (operator === '_starts_with') return 'Starts with...';
  if (operator === '_ends_with') return 'Ends with...';
  if (type === 'number') return 'Enter number...';
  return 'Enter value...';
}

// Date picker functions
function openDateModal(mode: 'single' | 'from' | 'to' = 'single') {
  datePickerMode.value = mode;
  
  if (mode === 'single') {
    tempDateValue.value = props.condition.value;
  } else if (mode === 'from') {
    tempDateValue.value = props.condition.value?.[0];
  } else if (mode === 'to') {
    tempDateValue.value = props.condition.value?.[1];
  }
  
  showDateModal.value = true;
}

function applyDateValue() {
  if (datePickerMode.value === 'single') {
    props.condition.value = tempDateValue.value;
  } else if (datePickerMode.value === 'from') {
    props.condition.value = [tempDateValue.value, props.condition.value?.[1] || ''];
  } else if (datePickerMode.value === 'to') {
    props.condition.value = [props.condition.value?.[0] || '', tempDateValue.value];
  }
  
  updateCondition();
  showDateModal.value = false;
}

// Array input parsing
function parseArrayInput(value: string) {
  if (!value.trim()) {
    props.condition.value = [];
    updateCondition();
    return;
  }
  
  const values = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
  
  if (props.condition.type === 'number') {
    props.condition.value = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
  } else {
    props.condition.value = values;
  }
  
  updateCondition();
}

// Range value update
function updateRangeValue(index: 0 | 1, value: any) {
  const currentValue = props.condition.value || ['', ''];
  currentValue[index] = value;
  props.condition.value = [...currentValue];
  updateCondition();
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

    // Get target table name and its first field
    const targetTableName = selectedOption.targetTable || props.tableName;
    const targetOptions = getCombinedOptionsForContext(targetTableName, props.schemas);
    const firstField = targetOptions.find(opt => opt.fieldCategory === "column");

    const newGroup: FilterGroup = {
      id: Math.random().toString(36).substring(2, 9),
      operator: "and",
      relationContext: newRelationContext,
      conditions: [
        {
          id: Math.random().toString(36).substring(2, 9),
          field: firstField?.value || "",
          operator: "_eq",
          value: null,
          type: firstField?.fieldType ? mapDbTypeToFilterType(firstField.fieldType) : "string",
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
        class="min-w-40 min-h-8"
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
      class="min-w-32 min-h-8"
    />
    <span v-else class="text-sm min-w-32">
      {{
        getOperatorsByType(condition.type || "string").find(
          (op) => op.value === condition.operator
        )?.label
      }}
    </span>

    <!-- ENHANCED VALUE INPUT(S) -->
    <template v-if="needsValue(condition.operator) || condition.operator === '_is_null'">
      <!-- _is_null - Checkbox with label -->
      <div v-if="condition.operator === '_is_null'" class="flex items-center gap-2 min-w-32">
        <UCheckbox 
          v-model="condition.value" 
          @update:model-value="updateCondition"
        />
        <span class="text-sm text-gray-600">
          {{ condition.value ? 'Is empty' : 'Is not empty' }}
        </span>
      </div>

      <!-- Boolean Select -->
      <USelect
        v-else-if="!readonly && condition.type === 'boolean'"
        v-model="condition.value"
        :items="[
          { label: 'True', value: true },
          { label: 'False', value: false },
        ]"
        @update:model-value="updateCondition"
        class="min-w-32 min-h-8"
      />

      <!-- Date Picker - Single -->
      <UButton
        v-else-if="!readonly && condition.type === 'date' && !needsTwoValues(condition.operator)"
        @click="openDateModal('single')"
        variant="outline"
        :label="condition.value ? formatDate(condition.value) : 'Select date'"
        icon="i-heroicons-calendar"
        size="sm"
        class="min-w-32 min-h-8"
      />

      <!-- Between Values - Enhanced for dates -->
      <div
        v-else-if="!readonly && needsTwoValues(condition.operator)"
        class="flex items-center gap-1"
      >
        <!-- Date Range -->
        <template v-if="condition.type === 'date'">
          <UButton
            @click="openDateModal('from')"
            variant="outline"
            :label="condition.value?.[0] ? formatDate(condition.value[0]) : 'From'"
            icon="i-heroicons-calendar"
            size="sm"
            class="w-24"
          />
          <span class="text-xs text-gray-500">and</span>
          <UButton
            @click="openDateModal('to')"
            variant="outline"
            :label="condition.value?.[1] ? formatDate(condition.value[1]) : 'To'"
            icon="i-heroicons-calendar"
            size="sm"
            class="w-24"
          />
        </template>
        
        <!-- Number Range -->
        <template v-else>
          <UInput
            :model-value="condition.value?.[0] || ''"
            @update:model-value="(val) => updateRangeValue(0, val)"
            :type="condition.type === 'number' ? 'number' : 'text'"
            size="sm"
            class="w-24"
            placeholder="From"
          />
          <span class="text-xs text-gray-500">and</span>
          <UInput
            :model-value="condition.value?.[1] || ''"
            @update:model-value="(val) => updateRangeValue(1, val)"
            :type="condition.type === 'number' ? 'number' : 'text'"
            size="sm"
            class="w-24"
            placeholder="To"
          />
        </template>
      </div>

      <!-- Multi-select for _in, _not_in with enums -->
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
        class="min-w-32 min-h-8"
      />

      <!-- Single select for enums -->
      <USelect
        v-else-if="!readonly && condition.type === 'select'"
        v-model="condition.value"
        :items="getFieldOptions(condition.field, tableName, schemas)"
        @update:model-value="updateCondition"
        class="min-w-32 min-h-8"
      />

      <!-- Array input for _in, _not_in with other types -->
      <UInput
        v-else-if="!readonly && ['_in', '_not_in'].includes(condition.operator)"
        v-model="arrayDisplayValue"
        :placeholder="getArrayPlaceholder(condition.type)"
        size="sm"
        class="min-w-32 min-h-8"
      />

      <!-- Default Single Input -->
      <UInput
        v-else-if="!readonly"
        v-model="condition.value"
        @update:model-value="updateCondition"
        :type="getInputType(condition.type)"
        size="sm"
        class="min-w-32 min-h-8"
        :placeholder="getInputPlaceholder(condition.operator, condition.type)"
      />

      <!-- Readonly Value Display -->
      <span v-else class="text-sm">
        <template v-if="condition.operator === '_is_null'">
          {{ condition.value ? 'Is empty' : 'Is not empty' }}
        </template>
        <template v-else-if="needsTwoValues(condition.operator)">
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

  <!-- Date Picker Modal -->
  <UModal v-model="showDateModal">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Select Date</h3>
      </template>
      
      <div class="p-4">
        <DatePicker v-model="tempDateValue" />
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton 
            variant="outline" 
            @click="showDateModal = false"
          >
            Cancel
          </UButton>
          <UButton 
            @click="applyDateValue" 
            color="primary"
          >
            Apply
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
