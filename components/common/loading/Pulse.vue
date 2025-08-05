<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  type?: 'ripple' | 'breath' | 'heart';
}>(), {
  size: 'md',
  color: 'blue-500',
  type: 'ripple'
});

const pulseSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-6 h-6';
    case 'lg': return 'w-12 h-12';
    default: return 'w-8 h-8';
  }
});
</script>

<template>
  <!-- Ripple Effect -->
  <div v-if="type === 'ripple'" class="relative flex items-center justify-center">
    <div :class="[pulseSize, `bg-${color}`, 'rounded-full opacity-75 animate-ping absolute']"></div>
    <div :class="[pulseSize, `bg-${color}`, 'rounded-full opacity-75 animate-ping absolute']" style="animation-delay: 0.5s;"></div>
    <div :class="[pulseSize.replace('w-', 'w-').replace('h-', 'h-').replace('6', '3').replace('8', '4').replace('12', '6'), `bg-${color}`, 'rounded-full relative']"></div>
  </div>

  <!-- Breathing -->
  <div v-else-if="type === 'breath'" class="flex items-center justify-center">
    <div :class="[pulseSize, `bg-${color}`, 'rounded-full animate-pulse']" style="animation-duration: 2s;"></div>
  </div>

  <!-- Heartbeat -->
  <div v-else class="flex items-center justify-center">
    <div :class="[pulseSize, `bg-${color}`, 'rounded-full']" style="animation: heartbeat 1.5s infinite;">
      <div class="w-full h-full rounded-full opacity-50 animate-ping"></div>
    </div>
  </div>
</template>

<style scoped>
@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.1);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(1);
  }
}
</style>