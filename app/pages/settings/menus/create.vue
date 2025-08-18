<script setup lang="ts">
const toast = useToast();

const tableName = "menu_definition";
const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});

const { validate, generateEmptyForm } = useSchema(tableName);

// Dynamic excluded fields based on form state
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
    // If parent is selected, exclude path and sidebar (child inherits parent's sidebar)
    if (form.value.parent) {
      baseExcluded.push('path', 'sidebar');
    }
    // If sidebar is selected, exclude parent (direct menu under sidebar)  
    else if (form.value.sidebar) {
      baseExcluded.push('parent');
    }
  }
  
  return baseExcluded;
});

// Dynamic type map based on form state  
const typeMap = computed(() => {
  const baseTypeMap: Record<string, any> = {
    order: {
      componentProps: {
        min: 0,
        step: 1,
      },
    },
    permission: {
      type: 'permission',
    },
  };
  
  // If path is already filled, make it read-only for clarity
  if (form.value.path) {
    baseTypeMap.path = {
      componentProps: {
        readonly: true,
        placeholder: 'Path auto-generated or inherited from parent'
      }
    };
  }
  
  return baseTypeMap;
});

// Menu registry composables for reregistering after changes
const { fetchMenuDefinitions } = useMenuApi();
const { reregisterAllMenus, registerTableMenusWithSidebarIds } =
  useMenuRegistry();
const { tables } = useGlobalState();

// API composable for creating menu
const { execute: createMenu, pending: creating } = useApiLazy(
  () => "/menu_definition",
  {
    method: "post",
    errorContext: "Create Menu",
  }
);

// Register header actions
useHeaderActionRegistry([
  {
    id: "save-menu",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
    submit: saveMenu,
    loading: computed(() => creating.value),
    permission: {
      and: [
        {
          route: "/menu_definition",
          actions: ["create"],
        },
      ],
    },
  },
]);

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
    form.value.path = null;
  }
});

watch(() => form.value.sidebar, (newSidebar) => {
  if (newSidebar && form.value.type === 'menu') {
    form.value.parent = null;
  }
});

onMounted(() => {
  form.value = generateEmptyForm();
});

async function saveMenu() {
  // Validate form
  const validationResult = validate(form.value);
  if (
    !validationResult.isValid &&
    Object.keys(validationResult.errors).length > 0
  ) {
    errors.value = validationResult.errors;
    toast.add({
      title: "Validation Error",
      description: "Please check the form for errors",
      color: "error",
    });
    return;
  }

  // Create menu
  await createMenu({ body: form.value });

  // Reregister all menus after create
  await reregisterAllMenus(fetchMenuDefinitions as any);

  // Also reregister table menus to ensure consistency
  if (tables.value.length > 0) {
    await registerTableMenusWithSidebarIds(tables.value);
  }

  toast.add({
    title: "Success",
    description: "Menu created successfully",
    color: "success",
  });

  // Redirect to menus list
  await navigateTo("/settings/menus");
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <UIcon name="lucide:plus" class="text-2xl text-primary" />
        <div class="text-xl font-bold text-primary">Create New Menu</div>
      </div>
    </div>

    <UForm :state="form" @submit="saveMenu" class="space-y-6">
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Menu Information</h3>
          </div>
        </template>

        <FormEditor
          v-model="form"
          v-model:errors="errors"
          :table-name="tableName"
          :excluded="excludedFields"
          :type-map="typeMap"
        />
      </UCard>
    </UForm>
  </div>
</template>
