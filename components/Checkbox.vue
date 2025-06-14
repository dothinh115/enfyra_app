<template>
  <label
    class="inline-flex items-center cursor-pointer"
    :class="reverse ? 'flex-row-reverse gap-2' : 'gap-2'"
  >
    <span class="text-sm text-gray-700">
      <slot />
    </span>
    <input
      type="checkbox"
      class="sr-only"
      :checked="modelValue"
      @change="handleChange"
    />
    <div
      class="relative w-10 h-6 bg-gray-300 rounded-full transition duration-300"
      :class="modelValue ? 'bg-primary' : ''"
    >
      <span
        class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition duration-300"
        :class="[
          reverse
            ? modelValue
              ? 'right-0.5 -translate-x-4'
              : 'right-0.5'
            : modelValue
            ? 'left-0.5 translate-x-4'
            : 'left-0.5',
        ]"
      ></span>
    </div>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  reverse?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.checked);
}
</script>
