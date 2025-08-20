<script setup lang="ts">
const showCreateModal = ref(false);
const { getIncludeFields } = useSchema("folder_definition");
const { isMounted } = useMounted();

// Get root folders (folders without parent)
const {
  data: rootFolders,
  pending: rootPending,
  execute: fetchRootFolders,
} = useApiLazy(() => `folder_definition`, {
  query: {
    fields: getIncludeFields(),
    limit: 0,
    sort: "-order,-createdAt",
    filter: {
      parent: {
        id: {
          _is_null: true,
        },
      },
    },
  },
  errorContext: "Load Root Folders",
});

// Filtered folders - just return data for now
const filteredFolders = computed(() => {
  return rootFolders.value?.data || [];
});

// Stats
const folderStats = computed(() => {
  const total = rootFolders.value?.data?.length || 0;
  const systemFolders =
    rootFolders.value?.data?.filter((f: any) => f.isSystem)?.length || 0;
  return {
    total,
    system: systemFolders,
    user: total - systemFolders,
  };
});

// Execute API call when component mounts
onMounted(() => {
  fetchRootFolders();
});

// Handle folder created - ignore the folder data parameter
function handleFolderCreated() {
  fetchRootFolders();
}

// Register header action for create folder
useHeaderActionRegistry([
  {
    id: "create-folder",
    label: "New Folder",
    icon: "lucide:folder-plus",
    onClick: () => {
      showCreateModal.value = true;
    },
    side: "right",
    color: "primary",
  },
]);

</script>

<template>
  <div class="space-y-8">
    <!-- Modern Header Section -->
    <div class="relative overflow-hidden">
      <!-- Background Gradient -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-primary-400/5 to-transparent rounded-2xl"
      />

      <!-- Content -->
      <div class="relative py-10 px-6">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1
              class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent"
            >
              Folder Manager
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Organize your files and documents efficiently
            </p>
          </div>

          <!-- Quick Stats Cards -->
          <div class="hidden lg:flex items-center gap-4">
            <div
              class="bg-white dark:bg-gray-800 rounded-xl px-6 py-4 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
                >
                  <UIcon name="lucide:folder" class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {{ folderStats.total }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Total Folders
                  </p>
                </div>
              </div>
            </div>

            <div
              class="bg-white dark:bg-gray-800 rounded-xl px-6 py-4 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
                >
                  <UIcon
                    name="lucide:shield"
                    class="w-5 h-5 text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {{ folderStats.system }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">System</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shared Folder Manager -->
    <FolderManager
      :folders="filteredFolders"
      :loading="!isMounted || rootPending"
      empty-title="No folders yet"
      empty-description="Create your first folder to start organizing your files and documents."
      :show-create-button="true"
      @refresh-folders="fetchRootFolders"
      @create-folder="showCreateModal = true"
    />

    <!-- Create Folder Modal -->
    <FolderCreateModal v-model="showCreateModal" @created="handleFolderCreated" />
  </div>
</template>
