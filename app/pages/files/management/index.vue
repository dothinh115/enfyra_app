<script setup lang="ts">
const showCreateModal = ref(false);
const showUploadModal = ref(false);
const { getIncludeFields: getFolderFields } = useSchema("folder_definition");
const { getIncludeFields: getFileFields } = useSchema("file_definition");

// Get root folders (folders without parent)
const {
  data: rootFolders,
  pending: rootPending,
  execute: fetchRootFolders,
} = useApiLazy(() => `folder_definition`, {
  query: {
    fields: getFolderFields(),
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

// Get root files (files without folder)
const {
  data: rootFiles,
  pending: filesPending,
  execute: fetchRootFiles,
} = useApiLazy(() => `file_definition`, {
  query: {
    fields: getFileFields(),
    limit: 0,
    sort: "-createdAt",
    filter: {
      folder: {
        id: {
          _is_null: true,
        },
      },
    },
  },
  errorContext: "Load Root Files",
});

// Upload files API
const { execute: uploadFilesApi, error: uploadError } = useApiLazy(
  () => `file_definition`,
  {
    method: "post",
    errorContext: "Upload Files",
  }
);

// Prepare folders data
const folders = computed(() => rootFolders.value?.data || []);

// Prepare files data
const files = computed(() => rootFiles.value?.data || []);

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

// Execute API calls when component mounts
onMounted(() => {
  fetchRootFolders();
  fetchRootFiles();
});

// Handle folder created - refresh both folders and files
function handleFolderCreated() {
  fetchRootFolders();
  fetchRootFiles();
}

// Handle refresh items
function handleRefreshItems() {
  fetchRootFolders();
  fetchRootFiles();
}

// Handle file upload
async function handleFileUpload(files: File | File[]) {
  const fileArray = Array.isArray(files) ? files : [files];

  // Create array of FormData objects for batch upload
  const formDataArray = fileArray.map((file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "null"); // null for root files
    return formData;
  });

  // Upload to /file_definition with batch support
  await uploadFilesApi({
    files: formDataArray,
  });

  // Check for errors
  if (uploadError.value) {
    return; // Error already handled by useApiLazy
  }

  // Refresh files list after successful upload
  await fetchRootFiles();

  // Close modal
  showUploadModal.value = false;

  // Show success message
  useToast().add({
    title: "Success",
    description: `${fileArray.length} file(s) uploaded successfully`,
    color: "success",
  });
}

// Register header actions
useHeaderActionRegistry([
  {
    id: "upload-files",
    label: "Upload Files",
    icon: "lucide:upload",
    onClick: () => {
      showUploadModal.value = true;
    },
    side: "right",
    color: "primary",
    permission: {
      and: [
        {
          route: "/file_definition",
          actions: ["create"],
        },
      ],
    },
  },
  {
    id: "create-folder",
    label: "New Folder",
    icon: "lucide:folder-plus",
    onClick: () => {
      showCreateModal.value = true;
    },
    side: "right",
    color: "secondary",
    permission: {
      and: [
        {
          route: "/folder_definition",
          actions: ["create"],
        },
      ],
    },
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
      :folders="folders"
      :files="files"
      :folders-loading="rootPending"
      :files-loading="filesPending"
      empty-title="No items yet"
      empty-description="Create folders or upload files to get started organizing your content."
      :show-create-button="true"
      @refresh-items="handleRefreshItems"
      @refresh-folders="fetchRootFolders"
      @refresh-files="fetchRootFiles"
      @create-folder="showCreateModal = true"
    />

    <!-- Upload Modal -->
    <CommonUploadModal
      v-model="showUploadModal"
      title="Upload Files"
      :multiple="true"
      accept="*/*"
      :max-size="50 * 1024 * 1024"
      @upload="handleFileUpload"
    />

    <!-- Create Folder Modal -->
    <FolderCreateModal
      v-model="showCreateModal"
      @created="handleFolderCreated"
    />

    <!-- Detail Modals -->
    <FolderDetailModal />
    <FileDetailModal />
  </div>
</template>
