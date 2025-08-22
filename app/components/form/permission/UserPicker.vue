<template>
  <Teleport to="body">
    <UDrawer
      v-model:open="isOpen"
      direction="right"
      class="w-full max-w-2xl"
      :ui="{
        header:
          'border-b border-muted text-muted pb-2 flex items-center justify-between',
      }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="lucide:users" class="w-5 h-5" />
          <div>
            <h3 class="text-lg font-semibold">Select Users</h3>
            <p class="text-sm text-muted-foreground mt-1">
              Choose users to grant direct access
            </p>
          </div>
        </div>
        <UButton
          @click="close"
          icon="lucide:x"
          color="error"
          variant="ghost"
          size="lg"
        />
      </template>

      <template #body>
        <div class="space-y-0">
          <!-- Filter Section -->
          <div class="p-4 border-b border-muted">
            <div class="flex justify-between items-center">
              <div class="text-sm text-muted-foreground">
                {{
                  hasActiveFilters(currentFilter)
                    ? "Filtered users"
                    : "All users"
                }}
              </div>
              <UButton
                :variant="hasActiveFilters(currentFilter) ? 'solid' : 'outline'"
                :color="
                  hasActiveFilters(currentFilter) ? 'secondary' : 'neutral'
                "
                icon="lucide:filter"
                @click="showFilterDrawer = true"
              >
                {{
                  hasActiveFilters(currentFilter)
                    ? `Filter (${currentFilter.conditions.length})`
                    : "Filter"
                }}
              </UButton>
            </div>
          </div>

          <!-- Users List Section -->
          <div class="p-4">
            <!-- Loading State -->
            <CommonLoadingState
              v-if="loading"
              type="form"
              context="inline"
              size="md"
            />

            <!-- Users List -->
            <div v-else-if="users.length > 0" class="space-y-2">
              <div
                v-for="user in users"
                :key="user.id"
                class="flex items-center justify-between p-3 border border-muted rounded-lg hover:bg-muted/20 cursor-pointer transition-colors"
                @click="selectUser(user)"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <UIcon name="lucide:user" class="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p class="font-medium text-sm">
                      {{ user.displayName || user.username || "Unknown User" }}
                    </p>
                    <p
                      v-if="user.email"
                      class="text-xs text-muted-foreground mt-1"
                    >
                      {{ user.email }}
                    </p>
                    <p
                      v-if="user.role?.name"
                      class="text-xs text-muted-foreground"
                    >
                      Role: {{ user.role.name }}
                    </p>
                  </div>
                </div>
                <UIcon
                  name="lucide:chevron-right"
                  class="w-4 h-4 text-muted-foreground"
                />
              </div>
            </div>

            <!-- Empty State -->
            <CommonEmptyState
              v-else
              :title="
                hasActiveFilters(currentFilter)
                  ? 'No users found'
                  : 'No users available'
              "
              :description="
                hasActiveFilters(currentFilter)
                  ? 'Try adjusting your filters'
                  : 'No users are available'
              "
              icon="lucide:users"
              size="md"
              type="form"
              context="inline"
            >
              <UButton
                v-if="hasActiveFilters(currentFilter)"
                variant="soft"
                icon="lucide:x"
                @click="clearFilter"
                class="mt-3"
              >
                Clear Filters
              </UButton>
            </CommonEmptyState>
          </div>

          <!-- Pagination Section -->
          <div
            v-if="!loading && total > limit"
            class="px-4 pb-4 pt-0 border-t border-muted"
          >
            <div class="flex items-center justify-between pt-4">
              <div class="text-sm text-muted-foreground">
                Showing {{ (page - 1) * limit + 1 }} to
                {{ Math.min(page * limit, total) }} of {{ total }} users
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  :disabled="page <= 1"
                  icon="lucide:chevron-left"
                  variant="ghost"
                  size="sm"
                  @click="page = page - 1"
                />
                <span class="text-sm font-medium">{{ page }}</span>
                <UButton
                  :disabled="page >= Math.ceil(total / limit)"
                  icon="lucide:chevron-right"
                  variant="ghost"
                  size="sm"
                  @click="page = page + 1"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Drawer -->
        <FormFilterDrawer
          v-model="showFilterDrawer"
          :filter="currentFilter"
          @apply="applyFilter"
        />
      </template>
    </UDrawer>
  </Teleport>
</template>

<script setup lang="ts">
// Composables
const { createEmptyFilter, hasActiveFilters } = useFilterQuery();

// Props
const props = defineProps<{
  modelValue: boolean;
}>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  select: [user: any];
}>();

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const showFilterDrawer = ref(false);
const currentFilter = ref(createEmptyFilter());
const page = ref(1);
const limit = 20;

// API for fetching users
const {
  data: usersData,
  pending: loading,
  execute: fetchUsers,
} = useApiLazy(() => "/user_definition", {
  query: computed(() => ({
    limit,
    page: page.value,
    fields: "id,username,displayName,email,role.id,role.name",
    ...(hasActiveFilters(currentFilter.value) && {
      filter: currentFilter.value,
    }),
  })),
  errorContext: "Fetch Users",
});

// Computed
const users = computed(() => usersData.value?.data || []);
const total = computed(() => usersData.value?.meta?.total || 0);

// Methods
function close() {
  emit("update:modelValue", false);
}

function selectUser(user: any) {
  emit("select", user);
  close();
}

function applyFilter(filter: any) {
  currentFilter.value = filter;
  page.value = 1;
  fetchUsers();
}

function clearFilter() {
  currentFilter.value = createEmptyFilter();
  page.value = 1;
  fetchUsers();
}

// Watch for page changes
watch(page, () => {
  fetchUsers();
});

// Initial fetch
onMounted(() => {
  fetchUsers();
});
</script>
