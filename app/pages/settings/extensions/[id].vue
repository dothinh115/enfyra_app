<template>
  <Transition name="loading-fade" mode="out-in">
    <CommonLoadingState
      v-if="!isMounted || loading"
      title="Loading extension..."
      description="Fetching extension details"
      size="sm"
      type="form"
      context="page"
    />

    <UForm
      v-else-if="detail"
      :state="form"
      @submit="updateExtension"
      class="space-y-6"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-puzzle-piece" class="text-2xl text-primary" />
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

        <FormEditorLazy
          v-model="form"
          v-model:errors="errors"
          :table-name="tableName"
          :excluded="['createdAt', 'updatedAt', 'isSystem', 'compiledCode']"
          :type-map="{
            code: { type: 'code', language: 'vue', height: '400px' },
          }"
        />
      </UCard>
    </UForm>

    <CommonEmptyState
      v-else
      title="Extension not found"
      description="The requested extension could not be loaded"
      icon="lucide:puzzle"
      size="sm"
    />
  </Transition>

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
const toast = useToast();
const { confirm } = useConfirm();

const tableName = "extension_definition";

const { isMounted } = useMounted();

const showUploadModal = ref(false);
const uploadLoading = ref(false);

const { validate, getIncludeFields } = useSchema(tableName);

useHeaderActionRegistry([
  {
    id: "save-extension",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
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
    id: "delete-extension",
    label: "Delete",
    icon: "lucide:trash",
    variant: "solid",
    color: "error",
    size: "md",
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
  {
    id: "upload-extension",
    label: "Upload",
    icon: "lucide:upload",
    variant: "outline",
    color: "secondary",
    size: "md",
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
]);

const {
  data: extensionData,
  pending: loading,
  execute: executeGetExtension,
} = useApiLazy(() => `/${tableName}`, {
  query: {
    fields: getIncludeFields(),
    filter: { id: { _eq: route.params.id } },
  },
  errorContext: "Fetch Extension",
});

const {
  error: updateError,
  execute: executeUpdateExtension,
  pending: updateLoading,
} = useApiLazy(() => `/${tableName}`, {
  method: "patch",
  errorContext: "Update Extension",
});

const {
  error: deleteError,
  execute: executeDeleteExtension,
  pending: deleteLoading,
} = useApiLazy(() => `/${tableName}`, {
  method: "delete",
  errorContext: "Delete Extension",
});

const detail = computed(() => extensionData.value?.data?.[0]);

const form = ref<Record<string, any>>({});

const errors = ref<Record<string, string>>({});

watch(
  extensionData,
  (newData) => {
    if (newData?.data?.[0]) {
      form.value = { ...newData.data[0] };
    }
  },
  { immediate: true }
);

async function updateExtension() {
  if (!form.value) return;

  const { isValid, errors: validationErrors } = validate(form.value);
  if (!isValid) {
    errors.value = validationErrors;
    toast.add({
      title: "Missing information",
      description: "Please fill in all required fields.",
      color: "error",
    });
    return;
  }

  await executeUpdateExtension({
    id: route.params.id as string,
    body: form.value,
  });

  // Check if there was an error
  if (updateError.value) {
    return;
  }

  toast.add({
    title: "Success",
    color: "success",
    description: "Extension updated!",
  });
  errors.value = {};
}

async function deleteExtension() {
  const ok = await confirm({
    title: "Are you sure?",
    content: "This action cannot be undone.",
  });
  if (!ok) return;

  await executeDeleteExtension({ id: route.params.id as string });

  // Check if there was an error
  if (deleteError.value) {
    return;
  }

  toast.add({ title: "Extension deleted", color: "success" });
  await navigateTo("/settings/extensions");
}

async function handleUpload(files: File | File[]) {
  const fileArray = Array.isArray(files) ? files : [files];
  if (fileArray.length === 0) return;

  uploadLoading.value = true;
  const file = fileArray[0];

  try {
    const content = await file?.text();
    form.value.code = content;
    showUploadModal.value = false;

    toast.add({
      title: "Success",
      description: "Extension code uploaded successfully",
      color: "success",
    });
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

onMounted(async () => {
  await executeGetExtension();
});
</script>
