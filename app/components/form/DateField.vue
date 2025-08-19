<template>
  <div>
    <!-- Date Field Button -->
    <UButton
      @click="openModal"
      variant="outline"
      :label="displayValue"
      icon="i-heroicons-calendar"
      size="sm"
      :class="buttonClass"
      :disabled="disabled"
    />

    <!-- Date Picker Modal -->
    <UModal v-model:open="showModal">
      <template #header>
        <div class="flex justify-between items-center w-full">
          <div class="text-base font-semibold">Select Date</div>
          <UButton
            icon="lucide:x"
            color="error"
            variant="soft"
            @click="showModal = false"
          >
            Close
          </UButton>
        </div>
      </template>
      
      <template #body>
        <div class="p-4">
          <UCalendar v-model="tempValue" />
        </div>
      </template>
      
      <template #footer>
        <div class="flex justify-end w-full">
          <UButton 
            @click="applyValue" 
            color="primary"
          >
            Apply
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { CalendarDate } from '@internationalized/date';
import { formatDate } from '~/utils/common/filter/filter-helpers';

const props = defineProps<{
  modelValue: Date | null;
  disabled?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Date | null];
}>();

const showModal = ref(false);
const tempValue = ref<CalendarDate | null>(null);

// Display value for button label
const displayValue = computed(() => {
  if (!props.modelValue) return 'Select date';
  return formatDate(props.modelValue);
});

// Button class binding
const buttonClass = computed(() => {
  return [
    'justify-start',
    props.class || ''
  ];
});

function openModal() {
  // Convert Date to CalendarDate for UCalendar
  if (props.modelValue) {
    try {
      const date = props.modelValue instanceof Date ? props.modelValue : new Date(props.modelValue);
      if (!isNaN(date.getTime())) {
        tempValue.value = new CalendarDate(
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate()
        );
      } else {
        tempValue.value = null;
      }
    } catch (error) {
      console.error("Error converting to CalendarDate:", error);
      tempValue.value = null;
    }
  } else {
    tempValue.value = null;
  }
  
  showModal.value = true;
}

function applyValue() {
  if (tempValue.value) {
    try {
      const date = new Date(tempValue.value.year, tempValue.value.month - 1, tempValue.value.day);
      emit('update:modelValue', date);
    } catch (error) {
      console.error("Error creating Date object:", error);
      emit('update:modelValue', null);
    }
  } else {
    emit('update:modelValue', null);
  }
  
  showModal.value = false;
}
</script>