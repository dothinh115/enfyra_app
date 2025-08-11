<script setup lang="ts">
import { useLoader } from "~/composables/useLoader";
const toast = useToast();
const { confirm } = useConfirm();

const { createLoader } = useLoader();

const tableName = "menu_definition";
const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});

const { validate, generateEmptyForm } = useSchema(tableName);

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

onMounted(() => {
  form.value = generateEmptyForm();
});

async function saveMenu() {
  // Validate form
  const validationResult = await validate(form.value);
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
        <Icon name="lucide:plus" class="text-2xl text-primary" />
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
          :excluded="['id', 'createdAt', 'updatedAt', 'isSystem']"
          :type-map="{
            order: {
              componentProps: {
                min: 0,
                step: 1,
              },
            },
          }"
        />
      </UCard>
    </UForm>
  </div>
</template>
