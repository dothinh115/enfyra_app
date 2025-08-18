<script setup lang="ts">
const route = useRoute();

const toast = useToast();
const { confirm } = useConfirm();

const tableName = "menu_definition";

const { isMounted } = useMounted();

// Form changes tracking via FormEditor
const hasFormChanges = ref(false);
const formEditorRef = ref();

const { validate, getIncludeFields } = useSchema(tableName);

const { fetchMenuDefinitions } = useMenuApi();
const { reregisterAllMenus } = useMenuRegistry();
const { tables } = useGlobalState();

const {
  data: menuData,
  pending: loading,
  execute: executeFetchMenu,
} = useApiLazy(() => `/${tableName}`, {
  query: {
    fields: getIncludeFields(),
    filter: { id: { _eq: Number(route.params.id) } },
  },
  errorContext: "Fetch Menu",
});

const {
  execute: executeUpdateMenu,
  pending: updateLoading,
  error: updateError,
} = useApiLazy(() => `/${tableName}`, {
  method: "patch",
  errorContext: "Update Menu",
});

const {
  execute: executeDeleteMenu,
  pending: deleteLoading,
  error: deleteError,
} = useApiLazy(() => `/${tableName}`, {
  method: "delete",
  errorContext: "Delete Menu",
});

const detail = computed(() => menuData.value?.data?.[0]);

const form = ref<Record<string, any>>({});

const errors = ref<Record<string, string>>({});

// Dynamic excluded fields based on form state (same logic as create page)
const excludedFields = computed(() => {
  const baseExcluded = ['id', 'createdAt', 'updatedAt', 'isSystem', 'children', 'menus'];
  
  // If no type selected, hide all relation fields
  if (!form.value.type) {
    baseExcluded.push('sidebar', 'parent', 'extension');
  }
  // If type is "mini", exclude sidebar and parent (mini sidebars are independent)
  else if (form.value.type === 'mini') {
    baseExcluded.push('sidebar', 'parent');
  }
  // If type is "menu"
  else if (form.value.type === 'menu') {
    // If parent is selected, exclude sidebar (child inherits parent's sidebar)
    // But keep path field visible as it might be required
    if (form.value.parent) {
      baseExcluded.push('sidebar');
    }
    // If sidebar is selected, exclude parent (direct menu under sidebar)  
    else if (form.value.sidebar) {
      baseExcluded.push('parent');
    }
  }
  
  return baseExcluded;
});

// Static type map to avoid reactive interference with inputs
const typeMap = {
  permission: {
    type: 'permission',
  },
};

watch(
  menuData,
  (newData) => {
    if (newData?.data?.[0]) {
      form.value = { ...newData.data[0] };
    }
  },
  { immediate: true }
);

// Watch type changes and clear conflicting fields
watch(() => form.value.type, (newType, oldType) => {
  if (oldType && newType !== oldType) {
    // Clear fields that should be excluded for the new type
    if (newType === 'mini') {
      form.value.sidebar = null;
      form.value.parent = null;
    } else if (newType === 'menu') {
      // If switching to menu, don't auto-clear as user might want to keep values
    } else {
      // If clearing type, clear all relation fields
      form.value.sidebar = null;
      form.value.parent = null;
      form.value.extension = null;
    }
  }
});

// Watch parent/sidebar mutual exclusion for menu type
watch(() => form.value.parent, (newParent) => {
  if (newParent && form.value.type === 'menu') {
    form.value.sidebar = null;
    // Don't clear path - user might want to set custom path for child menu
  }
});

watch(() => form.value.sidebar, (newSidebar) => {
  if (newSidebar && form.value.type === 'menu') {
    form.value.parent = null;
  }
});

useHeaderActionRegistry([
  {
    id: "save-menu",
    label: "Save Changes",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
    loading: updateLoading,
    disabled: computed(() => !hasFormChanges.value),
    onClick: updateMenuDetail,
    permission: {
      and: [
        {
          route: "/menu_definition",
          actions: ["update"],
        },
      ],
    },
  },
  {
    id: "delete-menu",
    label: "Delete",
    icon: "lucide:trash",
    variant: "solid",
    color: "error",
    size: "md",
    onClick: deleteMenuDetail,
    loading: deleteLoading,
    disabled: computed(() => detail.value?.isSystem || false),
    permission: {
      and: [
        {
          route: "/menu_definition",
          actions: ["delete"],
        },
      ],
    },
  },
]);

async function updateMenuDetail() {
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

  await executeUpdateMenu({ id: Number(route.params.id), body: form.value });

  // Check if there was an error
  if (updateError.value) {
    return;
  }

  await fetchMenuDefinitions();
  await reregisterAllMenus(fetchMenuDefinitions as any);

  toast.add({
    title: "Success",
    color: "success",
    description: "Menu updated!",
  });
  errors.value = {};
  
  // Confirm form changes as new baseline
  formEditorRef.value?.confirmChanges();
}

async function deleteMenuDetail() {
  const ok = await confirm({
    title: "Are you sure?",
    content: "This action cannot be undone.",
  });
  if (!ok) return;

  await executeDeleteMenu({ id: Number(route.params.id) });

  // Check if there was an error
  if (deleteError.value) {
    return;
  }

  await fetchMenuDefinitions();
  await reregisterAllMenus(fetchMenuDefinitions as any);

  toast.add({ title: "Menu deleted", color: "success" });
  await navigateTo("/settings/menus");
}

onMounted(async () => {
  await executeFetchMenu();
});
</script>

<template>
  <Transition name="loading-fade" mode="out-in">
    <CommonLoadingState
      v-if="!isMounted || loading"
      title="Loading menu..."
      description="Fetching menu details"
      size="sm"
      type="form"
      context="page"
    />

    <div v-else-if="detail" class="space-y-6">
      <div class="flex items-center gap-3">
        <UIcon
          :name="detail.icon || 'lucide:circle'"
          class="text-2xl text-primary"
        />
        <div class="text-xl font-bold text-primary">
          Menu: {{ detail.name }}
        </div>
      </div>

      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <UBadge color="primary" v-if="detail.isSystem"
                >System Menu</UBadge
              >
              <UBadge color="secondary" v-if="detail.isEnabled">Enabled</UBadge>
            </div>
          </div>
        </template>

        <FormEditorLazy
          ref="formEditorRef"
          v-model="form"
          v-model:errors="errors"
          v-model:has-changes="hasFormChanges"
          :table-name="tableName"
          :excluded="excludedFields"
          :type-map="typeMap"
        />
      </UCard>
    </div>

    <CommonEmptyState
      v-else
      title="Menu not found"
      description="The requested menu could not be loaded"
      icon="lucide:menu"
      size="sm"
    />
  </Transition>
</template>
