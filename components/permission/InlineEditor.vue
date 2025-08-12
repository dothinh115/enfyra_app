<template>
  <div class="space-y-3">
    <!-- Permission Summary -->
    <div class="p-3 border border-muted rounded-lg bg-muted/10">
      <div v-if="isAllowAll" class="flex items-center gap-2 text-success">
        <Icon name="lucide:shield-check" class="w-4 h-4" />
        <span class="text-sm font-medium">Allow All - No Restrictions</span>
      </div>
      <div v-else-if="getTotalPermissions() > 0" class="flex items-center gap-2">
        <Icon name="lucide:shield" class="w-4 h-4 text-primary" />
        <span class="text-sm">
          {{ getTotalPermissions() }} permission{{ getTotalPermissions() !== 1 ? 's' : '' }} configured
          <span v-if="localPermissionGroups.length > 0" class="text-muted-foreground">
            ({{ localPermissionGroups.length }} group{{ localPermissionGroups.length !== 1 ? 's' : '' }})
          </span>
        </span>
      </div>
      <div v-else class="flex items-center gap-2 text-muted-foreground">
        <Icon name="lucide:shield-off" class="w-4 h-4" />
        <span class="text-sm">No permissions configured</span>
      </div>
    </div>

    <!-- Edit Groups Button -->
    <div class="flex justify-end">
      <UButton
        icon="lucide:settings"
        size="sm"
        variant="outline"
        color="primary"
        @click="showModal = true"
        :disabled="props.disabled"
      >
        Configure Permissions
      </UButton>
    </div>

    <!-- Permission Configuration Drawer -->
    <Teleport to="body">
      <UDrawer
        v-model:open="showModal"
        direction="right"
        class="w-full max-w-3xl"
        :ui="{
          header:
            'border-b border-muted text-muted pb-2 flex items-center justify-between',
        }"
      >
        <template #header>
          <h2 class="text-lg font-semibold">Permission Configuration</h2>
          <UButton
            @click="showModal = false"
            icon="lucide:x"
            color="error"
            variant="ghost"
            size="lg"
          />
        </template>

        <template #body>
          <PermissionSelector
            :permission-groups="localPermissionGroups"
            :allow-all="isAllowAll"
            @apply="applyPermissionGroups"
            :disabled="props.disabled"
          />
        </template>
      </UDrawer>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: any;
  disabled?: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);
const showModal = ref(false);

// Local state for permission groups
const localPermissionGroups = ref<any[]>([]);

// Check if permission is allowAll
const isAllowAll = computed(() => {
  return props.modelValue?.allowAll === true;
});

// Parse permission groups from modelValue
const permissionGroups = computed(() => {
  if (!props.modelValue) return [];
  
  // Handle allowAll case
  if (props.modelValue.allowAll === true) {
    return [];
  }

  // Handle different permission formats
  if (Array.isArray(props.modelValue)) {
    // If it's an array, treat as single group
    return [
      {
        type: "and",
        conditions: props.modelValue,
      },
    ];
  }

  if (typeof props.modelValue === "object") {
    // Handle PermissionCondition format
    if (props.modelValue.and) {
      return [
        {
          type: "and",
          conditions: props.modelValue.and,
        },
      ];
    }
    if (props.modelValue.or) {
      return [
        {
          type: "or",
          conditions: props.modelValue.or,
        },
      ];
    }
    // Handle single PermissionRule
    if (props.modelValue.route) {
      return [
        {
          type: "and",
          conditions: [props.modelValue],
        },
      ];
    }
  }

  return [];
});

// Sync local groups with computed groups
watch(permissionGroups, (newGroups) => {
  localPermissionGroups.value = [...newGroups];
}, { immediate: true, deep: true });

function updateModelValue() {
  // Convert groups back to PermissionCondition format
  let result;

  if (localPermissionGroups.value.length === 0) {
    result = null;
  } else if (localPermissionGroups.value.length === 1) {
    const group = localPermissionGroups.value[0];
    const conditions = group.conditions || group.rules || [];
    if (group.type === "and") {
      result = { and: conditions };
    } else {
      result = { or: conditions };
    }
  } else {
    // Multiple groups - combine with AND
    const andGroups = localPermissionGroups.value.map((group: any) => ({
      [group.type]: group.conditions || group.rules || [],
    }));
    result = { and: andGroups };
  }

  emit("update:modelValue", result);
}

function applyPermissionGroups(data: any) {
  // This will be called from PermissionSelector
  if (data?.allowAll === true) {
    // Set allowAll mode
    emit("update:modelValue", { allowAll: true });
  } else {
    // Set normal permission groups
    localPermissionGroups.value = Array.isArray(data) ? [...data] : [];
    updateModelValue();
  }
  showModal.value = false;
}

function getTotalPermissions(): number {
  return localPermissionGroups.value.reduce((total, group) => {
    const conditions = group.conditions || group.rules || [];
    return total + conditions.length;
  }, 0);
}
</script>
