<template>
  <CommonLoadingState
    v-if="loading"
    title="Loading hook..."
    description="Fetching hook details"
    size="sm"
    type="form"
    context="page"
  />

  <UForm
    v-else-if="detail"
    :state="form"
    @submit="updateHook"
    class="space-y-6"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Icon name="lucide:zap" class="text-2xl text-primary" />
        <div class="text-xl font-bold text-primary">
          Hook: {{ detail.name || "(no name)" }}
        </div>
      </div>
      <PermissionGate
        :condition="{
          and: [
            {
              route: '/hook_definition',
              actions: ['delete'],
            },
          ],
        }"
      >
        <UButton
          v-if="!detail.isSystem"
          icon="lucide:trash-2"
          size="xl"
          color="error"
          :loading="createButtonLoader('delete-hook').isLoading.value"
          @click="deleteHook"
        />
      </PermissionGate>
    </div>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <UBadge color="primary" v-if="detail.isSystem">System Hook</UBadge>
            <UBadge color="secondary" v-if="detail.isEnabled">Enabled</UBadge>
          </div>
        </div>
      </template>

      <FormEditor
        v-model="form"
        v-model:errors="errors"
        :table-name="'hook_definition'"
        :excluded="['id', 'createdAt', 'updatedAt', 'isSystem']"
        :type-map="{
          isEnabled: {
            disabled: detail?.isSystem === true,
          },
          routeId: {
            componentProps: {
              disabled: detail?.isSystem === true,
            },
          },
        }"
      />
    </UCard>
  </UForm>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const toast = useToast();
const tableName = "hook_definition";
const { confirm } = useConfirm();

const { createButtonLoader } = useButtonLoading();
const id = route.params.id as string;

const detail = ref<Record<string, any> | null>(null);
const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const loading = ref(false);

const { validate, getIncludeFields } = useSchema(tableName);

// Register header actions
useHeaderActionRegistry({
  id: "save-hook",
  label: "Save",
  icon: "lucide:save",
  variant: "solid",
  color: "primary",
  submit: updateHook,
  loading: computed(() => updateLoading.value),
  permission: {
    and: [
      {
        route: "/hook_definition",
        actions: ["update"],
      },
    ],
  },
});

// Setup useApiLazy composables at top level
const {
  data: hookData,
  error: fetchError,
  execute: executeFetchHook,
} = useApiLazy(() => "/hook_definition", {
  query: {
    fields: getIncludeFields(),
    filter: { id: { _eq: id } },
  },
});

const {
  error: updateError,
  execute: executeUpdateHook,
  pending: updateLoading,
} = useApiLazy(() => `/hook_definition/${id}`, {
  method: "patch",
});

const {
  data: deleteData,
  error: deleteError,
  execute: executeDeleteHook,
} = useApiLazy(() => `/hook_definition/${id}`, {
  method: "delete",
});

async function fetchHookDetail() {
  loading.value = true;

  try {
    await executeFetchHook();

    if (fetchError.value) {
      toast.add({
        title: "Error",
        description: "Cannot load hook data",
        color: "error",
      });
      loading.value = false;
      return;
    }

    const record = hookData.value?.data?.[0];

    if (!record) {
      toast.add({
        title: "Hook not found",
        description: "Hook does not exist.",
        color: "error",
      });
      router.replace("/settings/hooks");
      loading.value = false;
      return;
    }

    detail.value = record;
    form.value = { ...record };
    errors.value = {};
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
}

async function updateHook() {
  const { isValid, errors: validationErrors } = validate(form.value);

  if (!isValid) {
    errors.value = validationErrors;
    toast.add({
      title: "Validation error",
      description: "Please check the fields with errors.",
      color: "error",
    });
    return;
  }

  try {
    await executeUpdateHook({ body: form.value });

    if (updateError.value) {
      toast.add({
        title: "Error",
        description: updateError.value.message,
        color: "error",
      });
    } else {
      toast.add({
        title: "Saved",
        description: "Hook has been updated",
        color: "primary",
      });
    }
  } catch (error) {
    // Error already handled by useApiLazy
  }
}

async function deleteHook() {
  const ok = await confirm({
    title: "Are you sure you want to delete this hook?",
  });
  if (!ok || detail.value?.isSystem) return;

  const deleteLoader = createButtonLoader("delete-hook");
  await deleteLoader.withLoading(async () => {
    try {
      await executeDeleteHook();

      if (deleteData.value) {
        toast.add({
          title: "Deleted",
          description: "Hook has been deleted",
          color: "primary",
        });
        router.push("/settings/hooks");
      } else if (deleteError.value) {
        toast.add({
          title: "Error",
          description: "Cannot delete",
          color: "error",
        });
      }
    } catch (error) {
      // Error already handled by useApiLazy
    }
  });
}

onMounted(fetchHookDetail);
watch(() => route.params.id, fetchHookDetail);
</script>
