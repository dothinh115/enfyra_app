<!-- components/FieldEditModal.vue -->
<template>
  <UModal v-model="visible" prevent-close>
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <div class="text-base font-semibold">
            Sửa {{ type === "column" ? "cột" : "quan hệ" }}:
            {{ model?.name || model?.propertyName || "Mới" }}
          </div>
          <UButton
            icon="lucide:x"
            variant="ghost"
            color="error"
            @click="emit('close')"
          />
        </div>
      </template>

      <!-- Nội dung chỉnh sửa -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- COLUMN -->
        <template v-if="type === 'column'">
          <UInput v-model="model.name" placeholder="Tên cột" />
          <USelect
            v-model="model.type"
            :items="columnTypes"
            placeholder="Kiểu dữ liệu"
          />
          <div class="flex items-center gap-2">
            <USwitch v-model="model.isNullable" />
            <span class="text-sm text-muted">Cho phép null</span>
          </div>
          <div class="flex items-center gap-2">
            <USwitch v-model="model.isIndex" />
            <span class="text-sm text-muted">Chỉ mục</span>
          </div>
          <UInput
            v-if="['varchar', 'text', 'int'].includes(model.type)"
            v-model="model.default"
            placeholder="Giá trị mặc định"
          />
          <UTextarea
            v-model="model.description"
            placeholder="Mô tả"
            class="md:col-span-2"
          />
        </template>

        <!-- RELATION -->
        <template v-else>
          <UInput v-model="model.propertyName" placeholder="Tên quan hệ" />
          <USelect
            v-model="model.type"
            :items="relationTypes"
            placeholder="Loại quan hệ"
          />
          <USelect
            v-model="model.targetTable"
            :items="tableOptions"
            placeholder="Bảng đích"
          />
          <div class="flex items-center gap-2">
            <USwitch v-model="model.isNullable" />
            <span class="text-sm text-muted">Cho phép null</span>
          </div>
          <div
            class="flex items-center gap-2"
            v-if="model.type === 'many-to-one'"
          >
            <USwitch v-model="model.isIndex" />
            <span class="text-sm text-muted">Chỉ mục</span>
          </div>
          <UTextarea
            v-model="model.description"
            placeholder="Mô tả quan hệ"
            class="md:col-span-2"
          />
        </template>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <UButton
            icon="lucide:trash"
            color="error"
            variant="soft"
            :disabled="model.isSystem"
            @click="emit('remove')"
          >
            Xoá
          </UButton>
          <UButton icon="lucide:check" label="Lưu" @click="emit('close')" />
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { columnTypes, relationTypes } from "~/utils/types/table.type";
const emit = defineEmits(["close", "remove"]);

const props = defineProps<{
  model: any;
  type: "column" | "relation";
  visible: boolean;
  tableOptions?: { label: string; value: any }[]; // chỉ dùng với relation
}>();
</script>
