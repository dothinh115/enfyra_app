<template>
  <div class="space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <label class="block text-sm font-medium">Allowed Users</label>
      <UButton
        v-if="!disabled"
        @click="showUserPicker = true"
        icon="lucide:plus"
        size="xs"
        variant="soft"
      >
        Add User
      </UButton>
    </div>

    <!-- Users List -->
    <div v-if="modelValue && modelValue.length > 0" class="space-y-2">
      <div
        v-for="(userId, index) in modelValue"
        :key="userId"
        class="flex items-center justify-between p-3 border border-muted rounded-lg bg-muted/10"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <UIcon name="lucide:user" class="w-4 h-4 text-primary" />
          </div>
          <div class="flex-1">
            <p class="font-medium text-sm">
              {{ getUserDisplayName(userId) || "Loading..." }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ getUserEmail(userId) || "Loading..." }}
            </p>
          </div>
        </div>
        <UButton
          v-if="!disabled"
          @click="removeUser(index)"
          icon="lucide:trash"
          size="sm"
          variant="ghost"
          color="error"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="p-4 border border-dashed border-muted rounded-lg text-center"
    >
      <UIcon
        name="lucide:users"
        class="w-8 h-8 text-muted-foreground mx-auto mb-2"
      />
      <p class="text-sm text-muted-foreground mb-2">
        No users have been granted direct access
      </p>
      <p class="text-xs text-muted-foreground">
        Click "Add User" to grant specific users access to this permission
      </p>
    </div>

    <!-- Help Text -->
    <p class="text-xs text-muted-foreground">
      Users in this list will have direct access to this permission, bypassing
      role-based restrictions.
    </p>

    <!-- User Picker -->
    <FormPermissionUserPicker v-model="showUserPicker" @select="addUser" />
  </div>
</template>

<script setup lang="ts">
// Props
const props = defineProps<{
  modelValue: string[];
  disabled?: boolean;
}>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

// State
const showUserPicker = ref(false);

// API for fetching user details
const { data: usersData, execute: fetchUsers } = useApiLazy(
  () => "/user_definition",
  {
    query: computed(() => ({
      limit: 1000,
      fields: "id,username,displayName,email",
      filter: {
        id: {
          _in: props.modelValue || [],
        },
      },
    })),
    errorContext: "Fetch Users",
  }
);

// Computed
const users = computed(() => usersData.value?.data || []);

// Methods
function addUser(user: any) {
  if (!props.modelValue) {
    emit("update:modelValue", [user.id]);
  } else if (!props.modelValue.includes(user.id)) {
    emit("update:modelValue", [...props.modelValue, user.id]);
  }
}

function removeUser(index: number) {
  const newUsers = [...props.modelValue];
  newUsers.splice(index, 1);
  emit("update:modelValue", newUsers);
}

function getUserDisplayName(userId: string): string {
  const user = users.value.find((u: any) => u.id === userId);
  return user?.displayName || user?.username || "Unknown User";
}

function getUserEmail(userId: string): string {
  const user = users.value.find((u: any) => u.id === userId);
  return user?.email || "";
}

// Watch for modelValue changes to fetch user details
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue.length > 0) {
      fetchUsers();
    }
  },
  { immediate: true }
);
</script>
