<template>
  <div>
    <!-- Permission Summary (Using UInput for consistency) -->
    <UInput
      readonly
      :disabled="props.disabled"
      :model-value="displayValue"
      :placeholder="placeholder"
      @click="showModal = true"
      class="w-full"
      :ui="{
        root: 'lg:hover:!bg-muted/50 lg:hover:!border-primary/50 transition-colors',
        base: 'transition-all duration-200 !cursor-pointer',
      }"
    >
      <template #leading>
        <UIcon :name="leadingIcon" :class="iconClass" />
      </template>

      <template #trailing>
        <UIcon
          name="lucide:chevron-right"
          class="w-4 h-4 text-muted-foreground"
        />
      </template>
    </UInput>

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
            @click="closeModal"
            icon="lucide:x"
            color="error"
            variant="ghost"
            size="lg"
          />
        </template>

        <template #body>
          <FormPermissionSelector
            :permission-groups="localFormPermissionGroups"
            :allow-all="isAllowAll"
            @apply="applyFormPermissionGroups"
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
const hasApplied = ref(false);

// Original state for revert
const originalPermissionGroups = ref<any[]>([]);
// Working state for editing
const localFormPermissionGroups = ref<any[]>([]);

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

// Initialize both original and local state when modal opens
watch(
  () => showModal.value,
  (isOpen) => {
    if (isOpen) {
      console.log(
        "🚀 Modal opened, cloning permissionGroups:",
        permissionGroups.value
      );
      // Reset apply flag
      hasApplied.value = false;
      // Make deep copies when opening modal
      originalPermissionGroups.value = JSON.parse(
        JSON.stringify(permissionGroups.value)
      );
      localFormPermissionGroups.value = JSON.parse(
        JSON.stringify(permissionGroups.value)
      );
    } else if (!hasApplied.value) {
      console.log("🚀 Modal closed without apply, reverting to original state");
      // When modal closes without apply, ensure we haven't emitted unwanted changes
      // Reset local state to original (this prevents accidental emit)
      localFormPermissionGroups.value = JSON.parse(
        JSON.stringify(originalPermissionGroups.value)
      );
    }
  }
);

// Initialize on mount
watch(
  permissionGroups,
  (newGroups) => {
    if (!showModal.value) {
      console.log(
        "🚀 External permissionGroups changed, updating local state:",
        newGroups
      );
      // Only update when modal is closed to reflect external changes
      originalPermissionGroups.value = JSON.parse(JSON.stringify(newGroups));
      localFormPermissionGroups.value = JSON.parse(JSON.stringify(newGroups));
    }
  },
  { immediate: true, deep: true }
);

function updateModelValue() {
  console.log(
    "🔧 updateModelValue called with localFormPermissionGroups:",
    localFormPermissionGroups.value
  );
  // Convert groups back to PermissionCondition format
  let result;

  if (localFormPermissionGroups.value.length === 0) {
    result = null;
  } else if (localFormPermissionGroups.value.length === 1) {
    const group = localFormPermissionGroups.value[0];
    const conditions = group.conditions || group.rules || [];
    if (group.type === "and") {
      result = { and: conditions };
    } else {
      result = { or: conditions };
    }
  } else {
    // Multiple groups - combine with AND
    const andGroups = localFormPermissionGroups.value.map((group: any) => ({
      [group.type]: group.conditions || group.rules || [],
    }));
    result = { and: andGroups };
  }

  console.log("🔧 Emitting update:modelValue with result:", result);
  emit("update:modelValue", result);
}

function applyFormPermissionGroups(data: any) {
  console.log("🔧 applyFormPermissionGroups called with:", data);
  // Mark that user has applied changes
  hasApplied.value = true;

  // This will be called from FormPermissionSelector
  if (data?.allowAll === true) {
    // Set allowAll mode
    console.log("🔧 Emitting allowAll:", { allowAll: true });
    emit("update:modelValue", { allowAll: true });
  } else {
    // Set normal permission groups
    localFormPermissionGroups.value = Array.isArray(data) ? [...data] : [data];
    console.log(
      "🔧 Calling updateModelValue with localFormPermissionGroups:",
      localFormPermissionGroups.value
    );
    updateModelValue();
  }
  showModal.value = false;
}

function closeModal() {
  console.log("🚀 closeModal called, hasApplied:", hasApplied.value);
  // Just close modal - revert logic is handled in watch
  showModal.value = false;
}

function cancelChanges() {
  console.log("🚀 cancelChanges called");
  // Revert local changes to original state
  localFormPermissionGroups.value = JSON.parse(
    JSON.stringify(originalPermissionGroups.value)
  );
  showModal.value = false;
}

function getTotalPermissions(): number {
  return localFormPermissionGroups.value.reduce((total, group) => {
    const conditions = group.conditions || group.rules || [];
    return total + conditions.length;
  }, 0);
}

// Computed properties for UInput
const displayValue = computed(() => {
  if (isAllowAll.value) {
    return "Allow All Access";
  } else if (getTotalPermissions() > 0) {
    const count = getTotalPermissions();
    return `${count} permission${count !== 1 ? "s" : ""} configured`;
  }
  return "";
});

const placeholder = computed(() => {
  if (isAllowAll.value || getTotalPermissions() > 0) {
    return "";
  }
  return "Click to configure permissions";
});

const leadingIcon = computed(() => {
  if (isAllowAll.value) return "lucide:shield-check";
  if (getTotalPermissions() > 0) return "lucide:shield";
  return "lucide:shield-off";
});

const iconClass = computed(() => {
  const baseClass = "w-4 h-4";
  if (isAllowAll.value) return `${baseClass} text-success`;
  if (getTotalPermissions() > 0) return `${baseClass} text-primary`;
  return `${baseClass} text-muted-foreground`;
});
</script>
