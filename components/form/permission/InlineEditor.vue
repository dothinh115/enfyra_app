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
        root: 'hover:!bg-muted/50 hover:!border-primary/50 transition-colors',
        base: 'transition-all duration-200 !cursor-pointer',
      }"
    >
      <template #leading>
        <Icon :name="leadingIcon" :class="iconClass" />
      </template>

      <template #trailing>
        <Icon
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
            @click="showModal = false"
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

// Local state for permission groups
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

// Sync local groups with computed groups
watch(
  permissionGroups,
  (newGroups) => {
    localFormPermissionGroups.value = [...newGroups];
  },
  { immediate: true, deep: true }
);

function updateModelValue() {
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

  emit("update:modelValue", result);
}

function applyFormPermissionGroups(data: any) {
  // This will be called from FormPermissionSelector
  if (data?.allowAll === true) {
    // Set allowAll mode
    emit("update:modelValue", { allowAll: true });
  } else {
    // Set normal permission groups
    localFormPermissionGroups.value = Array.isArray(data) ? [...data] : [];
    updateModelValue();
  }
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
