<template>
  <div v-if="loading" class="flex justify-center py-8">
    <div class="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
  </div>
  
  <UForm
    v-else-if="detail"
    :state="form"
    ref="globalForm"
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
      <UButton
        v-if="!detail.isSystem"
        icon="lucide:trash-2"
        size="xl"
        color="error"
        :loading="createButtonLoader('delete-hook').isLoading.value"
        @click="deleteHook"
      />
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

      <DynamicFormEditor
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
const { globalForm, globalFormLoading } = useGlobalState();
const { createButtonLoader } = useButtonLoading();
const id = route.params.id as string;

const detail = ref<Record<string, any> | null>(null);
const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const loading = ref(false);

const { validate, getIncludeFields } = useSchema(tableName);

async function fetchHookDetail() {
  loading.value = true;
  const { data, error } = await useApiLazy("/hook_definition", {
    query: {
      fields: getIncludeFields(),
      filter: { id: { _eq: id } },
    },
  });
  loading.value = false;

  if (error.value) {
    toast.add({
      title: "Lỗi",
      description: "Không thể tải dữ liệu hook",
      color: "error",
    });
    return;
  }

  const record = data.value?.data?.[0];

  if (!record) {
    toast.add({
      title: "Không tìm thấy hook",
      description: "Hook không tồn tại.",
      color: "error",
    });
    router.replace("/settings/hooks");
    return;
  }

  detail.value = record;
  form.value = { ...record };
  errors.value = {};
}

async function updateHook() {
  const { isValid, errors: validationErrors } = validate(form.value);

  if (!isValid) {
    errors.value = validationErrors;
    toast.add({
      title: "Có lỗi",
      description: "Vui lòng kiểm tra lại các trường bị lỗi.",
      color: "error",
    });
    return;
  }

  globalFormLoading.value = true;

  const { data, error } = await useApiLazy(`/hook_definition/${id}`, {
    method: "patch",
    body: form.value,
  });

  globalFormLoading.value = false;

  if (error.value) {
    toast.add({
      title: "Lỗi",
      description: error.value.message,
      color: "error",
    });
  } else {
    toast.add({
      title: "Đã lưu",
      description: "Hook đã được cập nhật",
      color: "primary",
    });
  }
}

async function deleteHook() {
  const ok = await confirm({ title: "Bạn có chắc chắn muốn xoá hook này?" });
  if (!ok || detail.value?.isSystem) return;

  const deleteLoader = createButtonLoader('delete-hook');
  await deleteLoader.withLoading(async () => {
    const { data, error } = await useApiLazy(`/hook_definition/${id}`, {
      method: "delete",
    });

    if (data.value) {
      toast.add({
        title: "Đã xoá",
        description: "Hook đã bị xoá",
        color: "primary",
      });
      router.push("/settings/hooks");
    } else if (error.value) {
      toast.add({
        title: "Lỗi",
        description: "Không thể xoá",
        color: "error",
      });
    }
  });
}

onMounted(fetchHookDetail);
watch(() => route.params.id, fetchHookDetail);
</script>
