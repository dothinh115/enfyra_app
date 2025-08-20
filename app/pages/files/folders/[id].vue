<script setup lang="ts">
const route = useRoute();
const showCreateModal = ref(false);
const { getIncludeFields } = useSchema("folder_definition");
const { isMounted } = useMounted();

// Get child folders
const {
  data: folder,
  pending,
  execute: fetchFolder,
} = useApiLazy(() => `/folder_definition`, {
  query: {
    fields: getIncludeFields(),
    sort: "-order,-createdAt",
    filter: {
      id: {
        _eq: route.params.id,
      },
    },
  },
  errorContext: "Load Child Folders",
});

// Execute API calls when component mounts
onMounted(async () => {
  await fetchFolder();
});

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
  },
]);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="!mb-20" v-if="isMounted && !pending">
      <h1 class="text-2xl font-bold text-gray-300">
        {{ folder?.data?.[0].name }} - Child Folders
      </h1>
    </div>

    <!-- Content -->
    <FolderManager
      :folders="folder?.data?.[0].children || []"
      :loading="!isMounted || pending"
      empty-title="No child folders found"
      empty-description="This folder doesn't contain any subfolders"
      :show-create-button="true"
      :parent-id="route.params.id as string"
      @refresh-folders="fetchFolder"
      @create-folder="showCreateModal = true"
    />

    <!-- Create Folder Modal -->
    <FolderCreateModal v-model="showCreateModal" @created="fetchFolder" :parent-id="route.params.id as string" />
  </div>
</template>
