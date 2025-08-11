<template>
  <!-- Loading state -->
  <div
    v-if="loading"
    class="flex flex-col items-center justify-center py-20 gap-4"
  >
    <div class="relative">
      <div class="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
      <div
        class="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"
      ></div>
    </div>
    <p class="text-sm text-muted-foreground">Loading extension...</p>
  </div>

  <!-- Form content -->
  <UForm
    v-else-if="detail"
    :state="form"
    @submit="updateExtension"
    class="space-y-6"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Icon name="i-heroicons-puzzle-piece" class="text-2xl text-primary" />
        <div class="text-xl font-bold text-primary">
          Extension: {{ detail.name }}
        </div>
      </div>
    </div>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <UBadge color="primary" v-if="form.isSystem"
              >System Extension</UBadge
            >
            <UBadge color="secondary" v-if="form.isEnabled">Enabled</UBadge>
            <UBadge color="info">{{ form.type }}</UBadge>
          </div>
        </div>
      </template>

      <FormEditor
        v-model="form"
        v-model:errors="errors"
        :table-name="tableName"
        :excluded="['id', 'createdAt', 'updatedAt', 'isSystem']"
      />
    </UCard>
  </UForm>

  <!-- Upload Modal -->
  <CommonUploadModal
    v-model="showUploadModal"
    title="Upload Extension"
    accept=".vue"
    :multiple="false"
    :max-size="5 * 1024 * 1024"
    drag-text="Drag and drop your .vue extension file here"
    accept-text="Only .vue files are accepted"
    upload-text="Upload Extension"
    uploading-text="Uploading..."
    :loading="uploadLoading"
    @upload="handleUpload"
    @error="
      (message) =>
        toast.add({
          title: 'Upload Error',
          description: message,
          color: 'error',
        })
    "
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
  title: "Extension Detail",
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const tableName = "extension_definition";
const detail = ref<Record<string, any> | null>(null);
const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const loading = ref(false);

// Upload modal state
const showUploadModal = ref(false);
const uploadLoading = ref(false);

const { validate, getIncludeFields } = useSchema(tableName);

// Register header actions
useHeaderActionRegistry([
  {
    id: "save-extension",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    submit: updateExtension,
    loading: computed(() => updateLoading.value),
    permission: {
      and: [
        {
          route: "/extension_definition",
          actions: ["update"],
        },
      ],
    },
  },
  {
    id: "upload-extension",
    label: "Upload",
    icon: "lucide:upload",
    variant: "solid",
    color: "secondary",
    onClick: () => (showUploadModal.value = true),
    permission: {
      and: [
        {
          route: "/extension_definition",
          actions: ["update"],
        },
      ],
    },
  },
  {
    id: "delete-extension",
    label: "Delete",
    icon: "lucide:trash",
    variant: "solid",
    color: "error",
    onClick: deleteExtension,
    loading: computed(() => deleteLoading.value),
    permission: {
      and: [
        {
          route: "/extension_definition",
          actions: ["delete"],
        },
      ],
    },
  },
]);

// Setup useApiLazy composables at top level
const {
  data: extensionData,
  error: fetchError,
  execute: executeFetchExtension,
} = useApiLazy(() => "/extension_definition", {
  query: {
    fields: getIncludeFields(),
    filter: { id: { _eq: Number(route.params.id) } },
  },
});

const {
  error: updateError,
  execute: executeUpdateExtension,
  pending: updateLoading,
} = useApiLazy(() => `/extension_definition`, {
  method: "patch",
});

const {
  error: deleteError,
  execute: executeDeleteExtension,
  pending: deleteLoading,
} = useApiLazy(() => `/extension_definition`, {
  method: "delete",
});

async function fetchExtensionDetail(extensionId: number) {
  loading.value = true;

  await executeFetchExtension();

  if (fetchError.value || !extensionData.value?.data?.[0]) {
    toast.add({
      title: "Not found",
      description: "This extension does not exist.",
      color: "error",
    });
    router.replace("/settings/extensions");
    loading.value = false;
    return;
  }

  detail.value = extensionData.value.data[0];
  form.value = { ...detail.value };
  errors.value = {};
  loading.value = false;
}

async function updateExtension() {
  const { isValid, errors: validationErrors } = validate(form.value);

  if (!isValid) {
    errors.value = validationErrors;
    toast.add({
      title: "Error",
      description: "Please check the fields with errors.",
      color: "error",
    });
    return;
  }

  await executeUpdateExtension({ id: detail.value?.id, body: form.value });

  // Chỉ hiện toast thành công nếu không có lỗi
  if (!updateError.value) {
    // Refetch data sau khi update thành công
    await executeFetchExtension();

    // Update form với data mới nhất
    if (extensionData.value?.data?.[0]) {
      detail.value = extensionData.value.data[0];
      form.value = { ...detail.value };
    }

    toast.add({
      title: "Saved",
      description: "Extension updated",
      color: "primary",
    });
  }
}

async function deleteExtension() {
  const ok = await confirm({ title: "Are you sure?" });
  if (!ok || detail.value?.isSystem) return;

  await executeDeleteExtension({ id: route.params.id as string });

  if (deleteError.value) {
    return;
  }

  toast.add({
    title: "Deleted",
    description: "Extension has been removed.",
    color: "primary",
  });

  router.push("/settings/extensions");
}

onMounted(() => fetchExtensionDetail(Number(route.params.id)));
watch(
  () => route.params.id,
  (newVal) => fetchExtensionDetail(Number(newVal))
);

async function handleUpload(files: File | File[]) {
  const fileArray = Array.isArray(files) ? files : [files];

  try {
    uploadLoading.value = true;

    for (const file of fileArray) {
      // Read file content and put it into form.code field
      const fileContent = await readFileContent(file);
      form.value.code = fileContent;

      toast.add({
        title: "File Loaded",
        description: `File "${file.name}" content has been loaded into the code field.`,
        color: "success",
      });
    }

    showUploadModal.value = false;
  } catch (error) {
    toast.add({
      title: "Upload Error",
      description: "Failed to read file content",
      color: "error",
    });
  } finally {
    uploadLoading.value = false;
  }
}

// Helper function to read file content
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}
</script>
