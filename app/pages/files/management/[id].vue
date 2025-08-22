<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const showCreateModal = ref(false);
const showUploadModal = ref(false);
const { getIncludeFields: getFolderFields } = useSchema("folder_definition");
const { getIncludeFields: getFileFields } = useSchema("file_definition");

// Pagination state
const folderPage = ref(Number(route.query.folderPage) || 1);
const filePage = ref(Number(route.query.filePage) || 1);
const pageLimit = 20; // Show 20 items per page

// Get current folder info
const {
  data: folder,
  pending: folderPending,
  execute: fetchFolder,
} = useApiLazy(() => `/folder_definition`, {
  query: {
    fields: getFolderFields(),
    filter: {
      id: {
        _eq: route.params.id,
      },
    },
  },
  errorContext: "Load Folder Info",
});

// Get child folders
const {
  data: childFolders,
  pending: childFoldersPending,
  execute: fetchChildFolders,
} = useApiLazy(() => `/folder_definition`, {
  query: {
    fields: getFolderFields(),
    limit: pageLimit,
    page: folderPage.value,
    meta: "*",
    sort: "-order,-createdAt",
    filter: {
      parent: {
        id: {
          _eq: route.params.id,
        },
      },
    },
  },
  errorContext: "Load Child Folders",
});

// Get files in this folder
const {
  data: folderFiles,
  pending: filesPending,
  execute: fetchFolderFiles,
} = useApiLazy(() => `/file_definition`, {
  query: {
    fields: getFileFields(),
    limit: pageLimit,
    page: filePage.value,
    meta: "*",
    sort: "-createdAt",
    filter: {
      folder: {
        id: {
          _eq: route.params.id,
        },
      },
    },
  },
  errorContext: "Load Folder Files",
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
const folders = computed(() => childFolders.value?.data || []);
const folderTotal = computed(() => childFolders.value?.meta?.totalCount || 0);

// Prepare files data
const files = computed(() => folderFiles.value?.data || []);
const fileTotal = computed(() => folderFiles.value?.meta?.totalCount || 0);

// Page title computation
const pageTitle = computed(() => {
  if (folderPending.value) return "Loading...";
  return `${folder.value?.data?.[0]?.name || "Unknown Folder"} - Files Manager`;
});

// Handle refresh
function handleRefreshItems() {
  // Reset to first page
  folderPage.value = 1;
  filePage.value = 1;

  // Update query
  router.push({
    query: { ...route.query, folderPage: "1", filePage: "1" },
  });

  fetchFolder();
  fetchChildFolders();
  fetchFolderFiles();
}

// Handle folder created
function handleFolderCreated() {
  // Reset to first page
  folderPage.value = 1;
  filePage.value = 1;

  // Update query
  router.push({
    query: { ...route.query, folderPage: "1", filePage: "1" },
  });

  fetchChildFolders();
  fetchFolderFiles();
}

// Handle file upload
async function handleFileUpload(files: File | File[]) {
  const fileArray = Array.isArray(files) ? files : [files];

  // Create array of FormData objects for batch upload
  const formDataArray = fileArray.map((file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", route.params.id as string); // folderId for files in this folder
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
  await fetchFolderFiles();

  // Close modal
  showUploadModal.value = false;

  // Show success message
  useToast().add({
    title: "Success",
    description: `${fileArray.length} file(s) uploaded successfully`,
    color: "success",
  });
}

// Execute API calls when component mounts
onMounted(async () => {
  // Fetch folder info first for header (non-blocking)
  await fetchFolder();

  // Fetch content in parallel (non-blocking)
  fetchChildFolders();
  fetchFolderFiles();
});

// Watch query changes and refetch data
watch(
  () => route.query.folderPage,
  async (newVal) => {
    folderPage.value = newVal ? Number(newVal) : 1;
    await fetchChildFolders();
  }
);

watch(
  () => route.query.filePage,
  async (newVal) => {
    filePage.value = newVal ? Number(newVal) : 1;
    await fetchFolderFiles();
  }
);

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
  <div class="space-y-6">
    <!-- Page Header -->
    <CommonPageHeader
      :title="pageTitle"
      description="Manage files and subfolders in this directory"
      title-size="lg"
      padding-y="py-6"
      show-background
      background-gradient="from-blue-500/5 via-indigo-400/3 to-transparent"
    />

    <!-- Content -->
    <FileManager
      :parent-id="route.params.id as string"
      :folders="folders"
      :files="files"
      :folders-loading="childFoldersPending"
      :files-loading="filesPending"
      empty-title="No items found"
      empty-description="This folder doesn't contain any files or subfolders"
      :show-create-button="true"
      @refresh-items="handleRefreshItems"
      @refresh-folders="fetchChildFolders"
      @refresh-files="fetchFolderFiles"
      @create-folder="showCreateModal = true"
    />

    <!-- Pagination -->
    <div
      class="flex justify-center gap-4 mt-6"
      v-if="!childFoldersPending && !filesPending"
    >
      <!-- Folder Pagination -->
      <div v-if="folderTotal > pageLimit" class="flex items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-gray-400">Folders:</span>
        <UPagination
          v-model:page="folderPage"
          :items-per-page="pageLimit"
          :total="folderTotal"
          show-edges
          :sibling-count="1"
          :to="
            (p) => ({
              path: route.path,
              query: { ...route.query, folderPage: p },
            })
          "
          color="secondary"
          active-color="secondary"
        />
      </div>

      <!-- File Pagination -->
      <div v-if="fileTotal > pageLimit" class="flex items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-gray-400">Files:</span>
        <UPagination
          v-model:page="filePage"
          :items-per-page="pageLimit"
          :total="fileTotal"
          show-edges
          :sibling-count="1"
          :to="
            (p) => ({
              path: route.path,
              query: { ...route.query, filePage: p },
            })
          "
          color="secondary"
          active-color="secondary"
        />
      </div>
    </div>

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
      :parent-id="route.params.id as string"
    />

    <!-- Detail Modals -->
    <FolderDetailModal />
    <FileDetailModal />
  </div>
</template>
