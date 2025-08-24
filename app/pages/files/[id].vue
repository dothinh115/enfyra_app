<script setup lang="ts">
import { UIcon } from "#components";
import { UForm } from "#components";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const { isMounted } = useMounted();

// Get ID from route params
const fileId = route.params.id as string;

// Fetch file data
const {
  data: file,
  pending,
  error,
  execute,
} = useApiLazy(() => `/file_definition`, {
  query: {
    filter: {
      id: {
        _eq: fileId,
      },
    },
  },
  errorContext: "Fetch File",
});

// Form state
const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const hasFormChanges = ref(false);
const formEditorRef = ref();

// API calls for update and delete
const {
  error: updateError,
  execute: executeUpdateFile,
  pending: updateLoading,
} = useApiLazy(() => `/file_definition`, {
  method: "patch",
  errorContext: "Update File",
});

const {
  error: deleteError,
  execute: executeDeleteFile,
  pending: deleteLoading,
} = useApiLazy(() => `/file_definition`, {
  method: "delete",
  errorContext: "Delete File",
});

// Header actions
useHeaderActionRegistry([
  {
    id: "save-file",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
    submit: saveFile,
    loading: computed(() => updateLoading.value),
    disabled: computed(() => !hasFormChanges.value),
    permission: {
      and: [
        {
          route: "/file_definition",
          actions: ["update"],
        },
      ],
    },
  },
  {
    id: "delete-file",
    label: "Delete",
    icon: "lucide:trash",
    variant: "solid",
    color: "error",
    size: "md",
    onClick: deleteFile,
    loading: computed(() => deleteLoading.value),
    permission: {
      and: [
        {
          route: "/file_definition",
          actions: ["delete"],
        },
      ],
    },
  },
]);

// Execute API calls
onMounted(async () => {
  await execute();
});

watch(
  file,
  (newData) => {
    if (newData?.data?.[0]) {
      form.value = { ...newData.data[0] };
    }
  },
  { immediate: true }
);

// Handle file update
async function saveFile() {
  await executeUpdateFile({
    id: fileId,
    body: form.value,
  });

  // Check if there was an error
  if (updateError.value) {
    return;
  }

  // Refresh file data
  await execute();

  // Show success message
  const toast = useToast();
  toast.add({
    title: "Success",
    description: "File updated successfully!",
    color: "success",
  });

  // Confirm form changes as new baseline
  formEditorRef.value?.confirmChanges();
}

// Handle file delete
async function deleteFile() {
  const ok = await confirm({
    title: "Are you sure?",
    content: "This action cannot be undone.",
  });
  if (!ok) return;

  await executeDeleteFile({ id: fileId });

  // Check if there was an error
  if (deleteError.value) {
    return;
  }

  toast.add({ title: "File deleted", color: "success" });
  await navigateTo("/files");
}

// Page title computation
const pageTitle = computed(() => {
  if (pending.value) return "Loading...";
  return file.value?.data?.[0]?.filename || "File Details";
});

// Get file icon and color based on mimetype
function getFileIconAndColor(mimetype: string): {
  icon: string;
  color: string;
  background: string;
} {
  if (!mimetype)
    return {
      icon: "lucide:file",
      color: "text-gray-300",
      background: "bg-gray-800",
    };

  if (mimetype.startsWith("image/"))
    return {
      icon: "lucide:image",
      color: "text-blue-300",
      background: "bg-blue-500/20",
    };
  if (mimetype.startsWith("video/"))
    return {
      icon: "lucide:video",
      color: "text-purple-300",
      background: "bg-purple-500/20",
    };
  if (mimetype.startsWith("audio/"))
    return {
      icon: "lucide:music",
      color: "text-green-300",
      background: "bg-green-500/20",
    };
  if (mimetype.includes("pdf"))
    return {
      icon: "lucide:file-text",
      color: "text-red-300",
      background: "bg-red-900/30",
    };
  if (mimetype.includes("zip") || mimetype.includes("archive"))
    return {
      icon: "lucide:archive",
      color: "text-yellow-300",
      background: "bg-yellow-900/30",
    };
  if (mimetype.startsWith("text/"))
    return {
      icon: "lucide:file-text",
      color: "text-cyan-300",
      background: "bg-cyan-900/30",
    };
  return {
    icon: "lucide:file",
    color: "text-gray-300",
    background: "bg-gray-800",
  };
}
</script>

<template>
  <div class="max-w-[1000px] lg:max-w-[1000px] md:w-full space-y-6">
    <!-- Page Header -->
    <CommonPageHeader
      :title="pageTitle"
      :description="`View and edit file information`"
      title-size="xl"
      show-background
      background-gradient="from-blue-500/8 via-cyan-400/4 to-transparent"
      padding-y="py-8"
    >
      <template #actions>
        <UButton
          variant="outline"
          icon="lucide:arrow-left"
          @click="router.back()"
        >
          Back
        </UButton>
      </template>
    </CommonPageHeader>

    <Transition name="loading-fade" mode="out-in">
      <!-- Loading State -->
      <div v-if="!isMounted || pending" class="flex justify-center py-12">
        <CommonLoadingState type="form" />
      </div>

      <!-- File Content -->
      <div v-else-if="form.id" class="space-y-6">
        <!-- File Preview -->
        <div
          class="bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-xl"
        >
          <div class="flex justify-center">
            <div
              v-if="form.mimetype?.startsWith('image/')"
              class="max-w-132 max-h-132"
            >
              <CommonImage
                :src="`/assets/${form.id}`"
                :alt="form.filename"
                class="object-contain h-full w-132 h-132"
                loading-area="custom"
                custom-loading-size="300px"
              />
            </div>

            <!-- File Icon for non-images -->
            <div v-else class="text-center">
              <div
                :class="[
                  getFileIconAndColor(form.mimetype).background,
                  'w-100 h-100 rounded-2xl flex items-center justify-center mx-auto',
                ]"
              >
                <UIcon
                  :name="getFileIconAndColor(form.mimetype).icon"
                  :class="getFileIconAndColor(form.mimetype).color"
                  size="192"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- File Editor Section -->
        <div
          class="space-y-4 bg-gray-800/50 rounded-xl border border-gray-700/50 p-6"
        >
          <div class="flex items-center gap-3">
            <UIcon name="lucide:edit-3" class="w-5 h-5" />
            <h3 class="text-lg font-semibold">Edit File Information</h3>
          </div>

          <UForm :state="form" @submit="saveFile">
            <FormEditorLazy
              ref="formEditorRef"
              v-model="form"
              v-model:errors="errors"
              v-model:has-changes="hasFormChanges"
              table-name="file_definition"
              :excluded="['id', 'createdAt', 'updatedAt', 'permissions']"
            />
          </UForm>
        </div>

        <!-- File Permissions Section -->
        <div class="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <PermissionManager
            table-name="file_permission_definition"
            :current-field-id="{ field: 'file', value: fileId }"
            icon="lucide:shield"
            title="File Permissions"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>
