<script setup lang="ts">
import { useFilterHistory } from "~/composables/useFilterHistory";

const props = defineProps<{
  modelValue: boolean;
  filterValue: FilterGroup;
  tableName: string;
}>();

const { schemas } = useGlobalState();
const { addToHistory } = useFilterHistory(props.tableName);
const { hasActiveFilters } = useFilterQuery();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:filter-value": [value: FilterGroup];
  apply: [];
  clear: [];
}>();

const localFilter = ref<FilterGroup>({ ...props.filterValue });

watch(
  () => props.filterValue,
  (newValue) => {
    localFilter.value = { ...newValue };
  },
  { deep: true }
);

function handleApply() {
  emit("update:filter-value", { ...localFilter.value });
  
  // Auto-save to filter history if there are active filters
  if (hasActiveFilters(localFilter.value)) {
    addToHistory(localFilter.value);
  }
  
  emit("apply");
  emit("update:modelValue", false);
}

function handleClear() {
  const emptyFilter: FilterGroup = {
    id: Math.random().toString(36).substring(2, 9),
    operator: "and",
    conditions: [],
  };

  localFilter.value = emptyFilter;
  emit("update:filter-value", emptyFilter);
  emit("clear");
  emit("update:modelValue", false);
}

function handleClose() {
  // Reset to original filter if user closes without applying
  localFilter.value = { ...props.filterValue };
  
  // If original filter was empty and user made changes but didn't apply,
  // emit clear to reset parent filter state
  if (!hasActiveFilters(props.filterValue)) {
    emit("clear");
  }
  
  emit("update:modelValue", false);
}

function applySavedFilter(filter: any) {
  localFilter.value = { ...filter };
  emit("update:filter-value", { ...filter });
  emit("apply");
  emit("update:modelValue", false);
}

const hasActiveConditions = computed(() => {
  return localFilter.value.conditions.some((condition) => {
    if ("field" in condition) {
      return condition.field && condition.operator;
    } else {
      return hasActiveFiltersLocal(condition);
    }
  });
});

function hasActiveFiltersLocal(group: FilterGroup): boolean {
  return group.conditions.some((condition) => {
    if ("field" in condition) {
      return condition.field && condition.operator;
    } else {
      return hasActiveFiltersLocal(condition);
    }
  });
}

const { isTablet } = useScreen();
</script>

<template>
  <Teleport to="body">
    <UDrawer
      :open="modelValue"
      @update:open="(value) => value ? null : handleClose()"
      direction="right"
      :class="isTablet ? 'w-full' : 'min-w-2xl'"
    >
      <template #header>
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-filter" class="w-8 h-8 mt-1" />
            <div>
              <h3 class="text-lg font-semibold">Filter {{ tableName }}</h3>
              <p class="text-sm text-gray-500 mt-1">
                {{
                  hasActiveConditions
                    ? `${localFilter.conditions.length} condition(s) configured`
                    : "No filters applied"
                }}
              </p>
            </div>
          </div>

          <UButton
            icon="i-lucide-x"
            size="md"
            color="error"
            variant="soft"
            @click="handleClose"
          >
            Close
          </UButton>
        </div>
      </template>

      <template #body>
        <div class="space-y-4">
          <div class="text-sm text-gray-600">
            Build your filter conditions below. Use AND/OR operators to combine
            multiple criteria.
          </div>

          <FilterBuilder
            v-model="localFilter"
            :schemas="schemas"
            :table-name="tableName"
          />

          <!-- Saved Filters Section -->
          <FilterSavedFilters
            :table-name="tableName"
            :current-filter="localFilter"
            @apply-filter="applySavedFilter"
            @clear-filters="handleClear"
          />
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            {{
              hasActiveConditions
                ? "Ready to apply filters"
                : "Add conditions above to filter results"
            }}
          </div>

          <div class="flex items-center gap-3">
            <UButton
              variant="soft"
              @click="handleClear"
              :disabled="!hasActiveConditions"
              icon="i-lucide-x"
              color="neutral"
            >
              Clear All
            </UButton>

            <UButton
              @click="handleClose"
              variant="outline"
              icon="i-lucide-x-circle"
              color="error"
            >
              Cancel
            </UButton>

            <UButton
              @click="handleApply"
              :disabled="!hasActiveConditions"
              class="min-w-[100px]"
              icon="i-lucide-check"
              color="primary"
            >
              Apply Filters
            </UButton>
          </div>
        </div>
      </template>
    </UDrawer>
  </Teleport>
</template>
