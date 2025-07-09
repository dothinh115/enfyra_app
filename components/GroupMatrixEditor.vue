<script setup lang="ts">
import { useModel } from "#imports";

const props = defineProps<{
  modelValue: string[][] | null;
  options: string[];
  label?: string;
  icon?: string;
  disabled?: boolean;
}>();

const groups = useModel(props, "modelValue");

watchEffect(() => {
  if (!groups.value) groups.value = [];
});

function addGroup() {
  groups.value!.push([""]);
}

function addFieldToGroup(groupIndex: number) {
  groups.value![groupIndex].push("");
}

function removeGroup(groupIndex: number) {
  groups.value!.splice(groupIndex, 1);
}

function isDuplicateGroup(currentGroup: string[], gIndex: number) {
  const normalized = [...currentGroup].sort().join("|");
  for (let i = 0; i < (groups.value?.length || 0); i++) {
    if (i === gIndex) continue;
    const compare = [...(groups.value![i] || [])].sort().join("|");
    if (compare === normalized) return true;
  }
  return false;
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2 text-lg font-semibold text-muted">
      <Icon :name="icon || 'lucide:layout-grid'" class="w-5 h-5" />
      {{ label || "Nhóm dữ liệu" }}
      <UButton
        icon="lucide:plus"
        size="sm"
        color="primary"
        @click="addGroup"
        :disabled="disabled"
      />
    </div>

    <div
      v-for="(group, gIndex) in groups || []"
      :key="gIndex"
      class="flex flex-wrap gap-2 items-center"
    >
      <USelectMenu
        v-for="(field, fIndex) in group"
        :key="fIndex"
        :items="
          options.filter((opt) => {
            const isInGroup = group.includes(opt);
            const isCurrent = group[fIndex] === opt;
            return isCurrent || !isInGroup;
          })
        "
        v-model="group[fIndex]"
        size="sm"
        class="min-w-[180px]"
        :color="
          group[fIndex] && group.filter((x) => x === group[fIndex]).length > 1
            ? 'error'
            : undefined
        "
      />

      <UButton
        icon="lucide:plus"
        size="xs"
        @click="addFieldToGroup(gIndex)"
        :disabled="disabled"
      />
      <UButton
        icon="lucide:trash"
        color="error"
        variant="ghost"
        size="xs"
        @click="removeGroup(gIndex)"
        :disabled="disabled"
      />

      <UBadge
        color="error"
        variant="soft"
        size="xs"
        v-if="isDuplicateGroup(group, gIndex)"
      >
        Trùng nhóm với nhóm khác
      </UBadge>
    </div>
  </div>
</template>
