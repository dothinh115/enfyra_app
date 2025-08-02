<script setup lang="ts">
import { useModel } from "#imports";

const props = withDefaults(
  defineProps<{
    modelValue: any;
    new?: boolean;
  }>(),
  {
    new: false,
  }
);

const emit = defineEmits(["save"]);
const table = useModel(props, "modelValue");
</script>

<template>
  <UCard class="bg-muted-50 rounded-xl shadow-sm">
    <template #header>
      <div class="space-y-4">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="text-xl font-semibold text-primary">
              {{
                !props.new ? `Edit Table: ${table.name}` : `Create New Table`
              }}
            </div>
          </div>
          <div>
            <slot name="tableName" />
          </div>
          <UTextarea
            v-model="table.description"
            placeholder="Describe this table"
            autoresize
            variant="subtle"
            class="text-sm w-full"
          />
        </div>
      </div>
    </template>

    <slot />
  </UCard>
</template>
