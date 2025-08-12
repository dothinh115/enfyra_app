<template>
  <div class="space-y-4">
    <!-- Allow All Toggle -->
    <div class="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
      <div>
        <label class="text-sm font-medium">Allow All Access</label>
        <p class="text-xs text-muted-foreground mt-1">Skip all permission checks</p>
      </div>
      <USwitch
        v-model="isAllowAll"
        :disabled="props.disabled"
        @update:model-value="handleAllowAllChange"
      />
    </div>

    <!-- Header with Add Group button -->
    <div v-if="!isAllowAll" class="flex gap-2 justify-between">
      <UButton
        icon="lucide:plus"
        variant="outline"
        color="primary"
        size="sm"
        @click="addNewGroup"
        :disabled="props.disabled"
      >
        Add Group
      </UButton>
    </div>

    <!-- Current Permission Structure -->
    <div v-if="!isAllowAll" class="space-y-3">
      <h3 class="text-sm font-medium text-muted-foreground">
        Permission Structure
      </h3>
      <div class="space-y-2">
        <PermissionGroup
          v-for="(group, index) in currentGroups"
          :key="group.id || index"
          :group="group"
          :disabled="props.disabled"
          @update:group="(updatedGroup) => updateGroup(index, updatedGroup)"
          @remove="() => removeGroup(index)"
        />
      </div>
    </div>

    <!-- Apply Button -->
    <div class="flex justify-end pt-4 border-t border-muted">
      <UButton
        icon="lucide:check"
        variant="solid"
        color="primary"
        @click="applyGroups"
        :disabled="props.disabled"
      >
        Apply
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  permissionGroups: any[];
  disabled?: boolean;
  allowAll?: boolean;
}>();

const emit = defineEmits(["apply"]);

const currentGroups = ref<any[]>([]);
const isAllowAll = ref(false);

// Watch for changes in permissionGroups prop
watch(
  () => props.permissionGroups,
  (newGroups) => {
    if (newGroups && newGroups.length > 0) {
      currentGroups.value = [...newGroups];
    } else {
      // Create default group if none exists
      currentGroups.value = [{
        id: Math.random().toString(36).substring(2, 9),
        type: "and",
        conditions: []
      }];
    }
  },
  { immediate: true }
);

// Watch for allowAll prop
watch(
  () => props.allowAll,
  (newValue) => {
    isAllowAll.value = newValue || false;
  },
  { immediate: true }
);

function addNewGroup() {
  const newGroup = {
    id: Math.random().toString(36).substring(2, 9),
    type: "and", // Default to AND
    conditions: [], // Support for nested conditions and groups
  };

  currentGroups.value.push(newGroup);
}

function updateGroup(groupIndex: number, updatedGroup: any) {
  currentGroups.value[groupIndex] = updatedGroup;
}

function removeGroup(groupIndex: number) {
  currentGroups.value.splice(groupIndex, 1);
}

function handleAllowAllChange(value: boolean) {
  isAllowAll.value = value;
  if (value) {
    // Clear groups when enabling allowAll
    currentGroups.value = [];
  } else {
    // Create default group when disabling allowAll
    currentGroups.value = [{
      id: Math.random().toString(36).substring(2, 9),
      type: "and",
      conditions: []
    }];
  }
}

function applyGroups() {
  emit("apply", isAllowAll.value ? { allowAll: true } : currentGroups.value);
}
</script>
