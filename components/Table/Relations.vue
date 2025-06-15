<script setup lang="ts">
import { relationTypes } from "~/utils/types/table.type";
import { useModel } from "#imports";

const props = defineProps<{
  modelValue: any[];
  tableOptions: { label: string; value: any }[];
}>();

const relations = useModel(props, "modelValue");
</script>

<template>
  <div class="divide-y divide-muted rounded-xl border border-muted mt-6">
    <div
      v-for="(rel, index) in relations"
      :key="rel.id ?? index"
      class="p-4 space-y-4"
    >
      <!-- Hàng 1: propertyName, type, targetTable, isIndex -->
      <div class="flex flex-wrap gap-4 items-start">
        <UFormField :error="rel.error?.propertyName" required>
          <UInput
            v-model="rel.propertyName"
            placeholder="Tên quan hệ"
            icon="lucide:link"
            :disabled="rel.isSystem"
            size="md"
            class="max-w-[200px] flex-1"
            :error="!!rel.error?.propertyName"
            :color="rel.error?.propertyName ? 'error' : undefined"
          />
        </UFormField>

        <UFormField :error="rel.error?.type" required>
          <USelect
            v-model="rel.type"
            :items="relationTypes"
            option-attribute="value"
            value-attribute="value"
            placeholder="Loại quan hệ"
            :disabled="rel.isSystem"
            size="md"
            class="max-w-[160px] flex-1"
            :error="!!rel.error?.type"
            :color="rel.error?.type ? 'error' : undefined"
          />
        </UFormField>

        <UFormField :error="rel.error?.targetTable" required>
          <USelect
            v-model="rel.targetTable"
            :items="props.tableOptions"
            placeholder="Bảng đích"
            :disabled="rel.isSystem"
            size="md"
            class="max-w-[240px] flex-1"
            :error="!!rel.error?.targetTable"
            :color="rel.error?.targetTable ? 'error' : undefined"
          />
        </UFormField>

        <div
          v-if="rel.type === 'many-to-one'"
          class="flex items-center gap-2 mt-2"
        >
          <USwitch v-model="rel.isIndex" :disabled="rel.isSystem" size="sm" />
          <span class="text-sm text-muted">Chỉ mục</span>
        </div>

        <div class="flex items-center gap-2 mt-2">
          <USwitch
            v-model="rel.isNullable"
            :disabled="rel.isSystem"
            size="sm"
          />
          <span class="text-sm text-muted">Cho phép null</span>
        </div>
      </div>

      <!-- Hàng 2: mô tả -->
      <div>
        <div
          class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-primary transition"
          @click="rel._editing = true"
          v-if="!rel._editing"
        >
          <Icon name="lucide:edit-3" class="w-4 h-4" />
          <span>{{ rel.description || "Nhấn để thêm mô tả..." }}</span>
        </div>
        <div v-else class="space-y-2">
          <UTextarea
            v-model="rel.description"
            placeholder="Mô tả quan hệ này"
            autoresize
            variant="subtle"
            class="text-sm w-full"
          />
          <div class="flex justify-end gap-2">
            <UButton
              icon="lucide:check"
              size="xs"
              variant="solid"
              color="primary"
              @click="rel._editing = false"
            />
            <UButton
              icon="lucide:x"
              size="xs"
              variant="solid"
              color="error"
              @click="rel._editing = false"
            />
          </div>
        </div>
      </div>

      <!-- Hàng 3: xoá -->
      <div class="flex justify-end">
        <UButton
          icon="lucide:trash"
          size="md"
          variant="solid"
          color="error"
          :disabled="rel.isSystem"
          @click="relations.splice(index, 1)"
        />
      </div>
    </div>

    <!-- Thêm quan hệ -->
    <div class="p-4 flex justify-end">
      <UButton
        icon="lucide:plus"
        label="Thêm quan hệ"
        @click="
          relations.push({
            propertyName: '',
            type: 'many-to-one',
            targetTable: null,
            description: '',
            isSystem: false,
            isIndex: false,
            isNullable: false,
            _editing: false,
            error: {},
          })
        "
      />
    </div>
  </div>
</template>
