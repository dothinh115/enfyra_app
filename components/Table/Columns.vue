<script setup lang="ts">
import { columnTypes } from "~/utils/types/table.type";
import { useModel } from "#imports";

const props = defineProps<{
  modelValue: any[];
}>();

const columns = useModel(props, "modelValue");
</script>

<template>
  <div class="divide-y divide-muted rounded-xl border border-muted">
    <div
      v-for="(column, index) in columns"
      :key="column.id ?? index"
      class="p-4 space-y-4"
    >
      <!-- Hàng 1: name, type, id, isIndex -->
      <div class="flex flex-wrap gap-4 items-start">
        <UFormField :error="column.error?.name" required>
          <UInput
            v-model="column.name"
            placeholder="Tên cột"
            icon="lucide:type"
            :disabled="column.isSystem || column.name === 'id'"
            size="md"
            class="max-w-[200px] flex-1"
            :error="!!column.error?.name"
            :color="column.error?.name ? 'error' : undefined"
          />
        </UFormField>

        <UFormField :error="column.error?.type" required>
          <USelect
            v-model="column.type"
            :items="columnTypes"
            option-attribute="value"
            value-attribute="value"
            placeholder="Kiểu dữ liệu"
            :disabled="column.isSystem"
            size="md"
            class="max-w-[160px] flex-1"
            :error="!!column.error?.type"
            :color="column.error?.type ? 'error' : undefined"
          />
        </UFormField>

        <div class="text-sm text-gray-400 font-mono mt-2 min-w-[80px]">
          #{{ column.id ?? "mới" }}
        </div>

        <div class="flex items-center gap-2 mt-2">
          <USwitch
            v-model="column.isIndex"
            :disabled="
              column.isSystem ||
              column.name === 'id' ||
              ['text', 'varchar', 'simple-json'].includes(column.type)
            "
            size="sm"
          />
          <span class="text-sm text-muted">Chỉ mục</span>
        </div>

        <div class="flex items-center gap-2 mt-2">
          <USwitch
            v-model="column.isNullable"
            :disabled="column.isSystem || column.name === 'id'"
            size="sm"
          />
          <span class="text-sm text-muted">Cho phép null</span>
        </div>
      </div>

      <!-- Hàng 2: mô tả -->
      <div>
        <div
          class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-primary transition"
          @click="column._editing = true"
          v-if="!column._editing"
        >
          <Icon name="lucide:edit-3" class="w-4 h-4" />
          <span>{{ column.description || "Nhấn để thêm mô tả..." }}</span>
        </div>
        <div v-else class="space-y-2">
          <UTextarea
            v-model="column.description"
            placeholder="Mô tả cột này"
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
              @click="column._editing = false"
            />
            <UButton
              icon="lucide:x"
              size="xs"
              variant="solid"
              color="error"
              @click="column._editing = false"
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
          :disabled="column.isSystem || column.isPrimary"
          @click="columns.splice(index, 1)"
        />
      </div>
    </div>

    <!-- Thêm cột -->
    <div class="p-4 flex justify-end">
      <UButton
        icon="lucide:plus"
        label="Thêm cột"
        @click="
          columns.push({
            name: '',
            type: 'varchar',
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
