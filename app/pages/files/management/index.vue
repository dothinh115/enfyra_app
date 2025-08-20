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

// Stats for PageHeader
const pageStats = computed(() => {
  const total = rootFolders.value?.data?.length || 0;
  const systemFolders =
    rootFolders.value?.data?.filter((f: any) => f.isSystem)?.length || 0;
  
  return [
    {
      icon: "lucide:folder",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      value: total,
      label: "Total Folders",
    },
    {
      icon: "lucide:shield",
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      value: systemFolders,
      label: "System",
    },
  ];
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
    <!-- Page Header -->
    <CommonPageHeader
      title="Files Manager"
      description="Organize your files and documents efficiently"
      :stats="pageStats"
    />

    <!-- Integrated File Manager -->
    <FileManager
      :loading="!isMounted"
      empty-title="No items yet"
      empty-description="Create folders or upload files to get started organizing your content."
      :show-create-button="true"
      @refresh-items="fetchRootFolders"
      @create-folder="showCreateModal = true"
    />

    <!-- Create Folder Modal -->
    <FolderCreateModal v-model="showCreateModal" @created="handleFolderCreated" />
    
    <!-- Detail Modals -->
    <FolderDetailModal />
    <FileDetailModal />
  </div>
</template>
