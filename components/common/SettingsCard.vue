<template>
  <div 
    class="relative group transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden"
    :class="cardClass"
  >
    <!-- Header -->
    <div class="px-5 py-4 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50 dark:to-transparent border-b border-gray-100 dark:border-gray-800">
      <div class="flex items-center gap-3">
        <!-- Icon -->
        <div 
          class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
          :class="iconBgClass"
        >
          <Icon 
            :name="icon" 
            class="w-5 h-5" 
            :class="iconClass"
          />
        </div>
        
        <!-- Title & Description -->
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-gray-900 dark:text-gray-100 truncate" :title="title">{{ title }}</div>
          <div 
            v-if="description" 
            class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" 
            :title="description"
          >
            {{ description }}
          </div>
        </div>
        
        <!-- Header Actions -->
        <div v-if="$slots.headerActions" class="flex items-center gap-2">
          <slot name="headerActions" />
        </div>
      </div>
    </div>

    <!-- Body Content - This will grow -->
    <div class="flex-1 px-5 py-4 space-y-3">
      <!-- Custom body content -->
      <slot />
      
      <!-- Stats -->
      <div v-if="stats && stats.length" class="space-y-2">
        <div 
          v-for="stat in stats" 
          :key="stat.label"
          class="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0"
        >
          <span class="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">{{ stat.label }}</span>
          <span class="text-gray-900 dark:text-gray-100 font-medium">
            <component 
              v-if="stat.component" 
              :is="stat.component" 
              v-bind="stat.props"
            >
              {{ stat.value }}
            </component>
            <template v-else>{{ stat.value }}</template>
          </span>
        </div>
      </div>
    </div>

    <!-- Footer - Always at bottom -->
    <div v-if="$slots.footer || (actions && actions.length > 0)" class="px-5 py-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 mt-auto">
      <!-- Custom footer content -->
      <slot name="footer" />
      
      <!-- Action Buttons -->
      <div v-if="actions && actions.length" class="flex gap-2">
        <UButton
          v-for="action in actions"
          :key="action.label"
          v-bind="action.props"
          :to="action.to"
          :loading="action.loading"
          :disabled="action.disabled"
          @click="action.onClick"
          :class="[
            action.block ? 'flex-1' : '',
            action.onClick || action.to ? 'cursor-pointer' : ''
          ]"
        >
          {{ action.label }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Stat {
  label: string;
  value?: string | number;
  component?: any;
  props?: Record<string, any>;
}

interface Action {
  label: string;
  props?: Record<string, any>;
  to?: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
}

interface Props {
  title: string;
  description?: string;
  icon: string;
  iconColor?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  stats?: Stat[];
  actions?: Action[];
  cardClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'primary',
  cardClass: '',
});

// Computed styles based on icon color
const iconBgClass = computed(() => {
  const colorMap = {
    primary: 'bg-primary/10 dark:bg-primary/20',
    success: 'bg-green-100 dark:bg-green-900/30', 
    warning: 'bg-amber-100 dark:bg-amber-900/30',
    error: 'bg-red-100 dark:bg-red-900/30',
    neutral: 'bg-gray-100 dark:bg-gray-800'
  };
  return colorMap[props.iconColor];
});

const iconClass = computed(() => {
  const colorMap = {
    primary: 'text-primary-600 dark:text-primary-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400', 
    error: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };
  return colorMap[props.iconColor];
});
</script>