<script setup lang="ts">
import type { TabletCardProps } from "../../utils/types";

const props = defineProps<TabletCardProps>();
const { isTablet } = useScreen();
</script>

<template>
  <div
    :class="[
      'p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md',
      'border border-gray-200 dark:border-gray-700',
      'hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200',
      'hover:shadow-xl hover:scale-[1.01] hover:bg-gray-50 dark:hover:bg-gray-750',
      onClick && !selectable && 'cursor-pointer',
      selectable && selected && 'ring-2 ring-primary-400 border-primary-400 bg-primary-50 dark:ring-primary-600 dark:border-primary-600 dark:bg-primary-950/30',
      isTablet ? 'min-h-[140px] h-full' : '',
    ]"
    @click="!selectable && onClick?.()"
    tabindex="0"
    @keydown.enter="!selectable && onClick?.()"
    @keydown.space.prevent="selectable && onToggleSelect?.()"
    :aria-selected="selectable ? selected : undefined"
  >
    <!-- Header with title and checkbox -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <!-- Primary field as title -->
        <h3 class="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">
          <span v-if="cells[0] && typeof cells[0].column.columnDef.cell !== 'function'">
            {{ cells[0]?.getValue() || 'Untitled' }}
          </span>
          <component
            v-else-if="cells[0]"
            :is="cells[0].column.columnDef.cell"
            v-bind="cells[0].getContext()"
          />
          <span v-else>Untitled</span>
        </h3>
      </div>
      
      <!-- Tablet Selection Checkbox -->
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

    <!-- Card content -->
    <div class="space-y-2">
      <div
        v-for="cell in cells.filter(c => c.column.id !== 'select').slice(1, isTablet ? 4 : 3)"
        :key="cell.id"
        class="flex items-center justify-between"
      >
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {{ cell.column.columnDef.header }}
        </span>
        <span class="text-sm text-gray-900 dark:text-gray-100 text-right">
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
  </div>
</template>