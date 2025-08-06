<script setup lang="ts">
interface Props {
  row: any;
  cells: any[];
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onClick?: () => void;
}

const props = defineProps<Props>();
</script>

<template>
  <div
    :class="[
      'p-4 rounded-lg border border-gray-200 dark:border-gray-800',
      'hover:border-gray-300 dark:hover:border-gray-700 transition-colors',
      onClick && !selectable && 'cursor-pointer',
      selectable && selected && 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-950',
    ]"
    @click="!selectable && onClick?.()"
    tabindex="0"
    @keydown.enter="!selectable && onClick?.()"
    @keydown.space.prevent="selectable && onToggleSelect?.()"
    :aria-selected="selectable ? selected : undefined"
  >
    <div class="flex items-start justify-between">
      <div class="space-y-2 flex-1">
        <div
          v-for="cell in cells.filter(c => c.column.id !== 'select').slice(0, 3)"
          :key="cell.id"
          class="flex items-center justify-between"
        >
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ cell.column.columnDef.header }}
          </span>
          <span class="text-sm text-gray-900 dark:text-gray-100">
            <span v-if="typeof cell.column.columnDef.cell !== 'function'">
              {{ cell.getValue() }}
            </span>
            <component
              v-else
              :is="cell.column.columnDef.cell"
              v-bind="cell.getContext()"
            />
          </span>
        </div>
      </div>
      
      <!-- Mobile Selection Checkbox -->
      <div v-if="selectable" class="ml-3">
        <input
          type="checkbox"
          class="rounded w-5 h-5 cursor-pointer"
          :checked="selected"
          @click.stop
          @change="onToggleSelect"
          :aria-label="`Select item ${row.id || 'unknown'}`"
        />
      </div>
    </div>
  </div>
</template>