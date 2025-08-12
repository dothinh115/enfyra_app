<script setup lang="ts">
import type { FilterGroup } from "~/utils/common/filter/FilterTypes";

const props = defineProps<{
  modelValue: boolean;
  filterValue: FilterGroup;
  tableName: string;
}>();

const { schemas } = useGlobalState();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:filterValue": [value: FilterGroup];
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
  emit("update:filterValue", { ...localFilter.value });
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
  emit("update:filterValue", emptyFilter);
  emit("clear");
  emit("update:modelValue", false);
}

function handleClose() {
  // Reset to original filter if user closes without applying
  localFilter.value = { ...props.filterValue };
  emit("update:modelValue", false);
}

const hasActiveConditions = computed(() => {
  return localFilter.value.conditions.some((condition) => {
    if ("field" in condition) {
      return condition.field && condition.operator;
    } else {
      return hasActiveFilters(condition);
    }
  });
});

function hasActiveFilters(group: FilterGroup): boolean {
  return group.conditions.some((condition) => {
    if ("field" in condition) {
      return condition.field && condition.operator;
    } else {
      return hasActiveFilters(condition);
    }
  });
}

const { isTablet } = useScreen();
</script>

<template>
  <Teleport to="body">
    <UDrawer
      :open="modelValue"
      @update:open="$emit('update:modelValue', $event)"
      direction="right"
      :class="isTablet ? 'w-full' : 'min-w-2xl'"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-filter" class="w-5 h-5" />
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
            size="sm"
            color="neutral"
            variant="ghost"
            @click="handleClose"
          />
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
