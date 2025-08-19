<template>
  <UInput
    v-model="displayValue"
    :placeholder="placeholder"
    class="min-w-32 min-h-8"
    @blur="normalizeInput"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: any[];
  fieldType: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: any[]];
}>();

const displayValue = computed({
  get: () => {
    if (Array.isArray(props.modelValue)) {
      return props.modelValue.join(',');
    }
    return '';
  },
  set: (value: string) => {
    parseArrayValue(value);
  }
});

const placeholder = computed(() => {
  return props.fieldType === 'number' ? '1,2,3' : 'value1,value2,value3';
});

function parseArrayValue(value: string) {
  if (!value.trim()) {
    emit('update:modelValue', []);
    return;
  }
  
  const values = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
  
  if (props.fieldType === 'number') {
    const numbers = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    emit('update:modelValue', numbers);
  } else {
    emit('update:modelValue', values);
  }
}

// Auto-normalize input format on blur
function normalizeInput() {
  // This will trigger the computed displayValue to re-render with proper format
  // The computed getter will join the array with ',' (no spaces)
  if (Array.isArray(props.modelValue) && props.modelValue.length > 0) {
    // Force re-render to show normalized format
    nextTick();
  }
}
</script>