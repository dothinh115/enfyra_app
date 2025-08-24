<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <UIcon :name="icon || 'lucide:shield'" class="w-5 h-5" />
        <h3 class="text-lg font-semibold">
          {{ title || `Permissions for ${tableName}` }}
        </h3>
      </div>
      <PermissionGate
        :condition="{
          or: [{ route: `/${permissionTableName}`, actions: ['create'] }],
        }"
      >
        <UButton
          @click="createNewPermission"
          icon="lucide:plus"
          color="primary"
          variant="solid"
          size="sm"
        >
          Add Permission
        </UButton>
      </PermissionGate>
    </div>

    <!-- Permissions List -->
    <div v-if="permissions.length > 0" class="space-y-3">
      <div
        v-for="permission in permissions"
        :key="permission.id"
        class="bg-gray-800/50 rounded-lg p-4 transition-colors border border-gray-700/50"
      >
        <PermissionGate
          :condition="{
            or: [{ route: `/${permissionTableName}`, actions: ['update'] }],
          }"
        >
          <div
            @click="editPermission(permission)"
            class="flex items-center justify-between cursor-pointer hover:bg-gray-700/50 rounded-lg p-2 -m-2"
          >
            <div class="flex items-center gap-3 flex-1">
              <UIcon name="lucide:shield" class="w-4 h-4 text-green-400" />
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-100">
                  {{ permission.description || "No description" }}
                </div>
                <div class="text-sm text-gray-400 mt-1">
                  ID: {{ permission.id }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UBadge
                :color="permission.isEnabled ? 'success' : 'neutral'"
                variant="soft"
                size="sm"
              >
                {{ permission.isEnabled ? "Enabled" : "Disabled" }}
              </UBadge>
              <PermissionGate
                :condition="{
                  or: [
                    { route: `/${permissionTableName}`, actions: ['delete'] },
                  ],
                }"
              >
                <UButton
                  icon="lucide:trash"
                  color="error"
                  variant="ghost"
                  size="sm"
                  @click.stop="deletePermission(permission)"
                  :loading="deleting === permission.id"
                />
              </PermissionGate>
              <UIcon
                name="lucide:chevron-right"
                class="w-4 h-4 text-gray-400"
              />
            </div>
          </div>
        </PermissionGate>

        <!-- Fallback for users without update permission -->
        <div
          v-if="
            !checkPermissionCondition({
              or: [{ route: `/${permissionTableName}`, actions: ['update'] }],
            })
          "
          class="flex items-center justify-between"
        >
          <div class="flex items-center gap-3 flex-1">
            <UIcon name="lucide:shield" class="w-4 h-4 text-green-400" />
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-100">
                {{ permission.description || "No description" }}
              </div>
              <div class="text-sm text-gray-400 mt-1">
                ID: {{ permission.id }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <UBadge
              :color="permission.isEnabled ? 'success' : 'neutral'"
              variant="soft"
              size="sm"
            >
              {{ permission.isEnabled ? "Enabled" : "Disabled" }}
            </UBadge>
            <PermissionGate
              :condition="{
                or: [{ route: `/${permissionTableName}`, actions: ['delete'] }],
              }"
            >
              <UButton
                icon="lucide:trash"
                color="error"
                variant="ghost"
                size="sm"
                @click.stop="deletePermission(permission)"
                :loading="deleting === permission.id"
              />
            </PermissionGate>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="permissions.length === 0"
      class="text-center py-8 text-muted-foreground"
    >
      <UIcon
        name="lucide:shield-off"
        class="w-12 h-12 mx-auto mb-3 opacity-50"
      />
      <p>No permissions found for this table.</p>
      <p class="text-sm">Click "Add Permission" to create one.</p>
    </div>

    <!-- Permission Editor Drawer -->
    <Teleport to="body">
      <UDrawer
        v-model:open="showDrawer"
        direction="right"
        class="w-full max-w-4xl"
        :ui="{
          header:
            'border-b border-muted text-muted pb-2 flex items-center justify-between',
        }"
      >
        <template #header>
          <h2 class="text-lg font-semibold">
            {{ isEditing ? "Edit Permission" : "Create Permission" }}
          </h2>
          <UButton
            @click="closeDrawer"
            icon="lucide:x"
            color="error"
            variant="ghost"
            size="lg"
          />
        </template>

        <template #body>
          <div class="p-6">
            <FormEditorLazy
              v-model="permissionForm"
              v-model:errors="permissionErrors"
              :table-name="permissionTableName"
              :excluded="[props.currentFieldId?.field as string]"
            />

            <!-- Action Buttons -->
            <div class="flex justify-end gap-3 pt-6 border-t border-muted">
              <UButton variant="outline" @click="closeDrawer"> Cancel </UButton>
              <UButton
                color="primary"
                :loading="saving"
                @click="savePermission"
              >
                {{ isEditing ? "Update" : "Create" }}
              </UButton>
            </div>
          </div>
        </template>
      </UDrawer>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { UIcon } from "#components";

const toast = useToast();
const { confirm } = useConfirm();
const { checkPermissionCondition } = usePermissions();

interface Permission {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  [key: string]: any;
}

interface Props {
  tableName: string;
  currentFieldId?: { field: string; value: string | number };
  icon?: string;
  title?: string;
}

const props = defineProps<Props>();

// State
const showDrawer = ref(false);
const isEditing = ref(false);
const currentPermission = ref<Permission | null>(null);
const permissionForm = ref<Record<string, any>>({});
const permissionErrors = ref<Record<string, string>>({});
const deleting = ref<string | number | null>(null);

// Computed
const permissionTableName = computed(() => props.tableName);

// Schema composable
const { generateEmptyForm } = useSchema(permissionTableName);

// API calls for CRUD operations
const {
  data: permissionsData,
  pending: loading,
  execute: fetchPermissions,
} = useApiLazy(() => `/${permissionTableName.value}`, {
  errorContext: "Fetch Permissions",
});

const {
  error: createError,
  execute: createPermission,
  pending: creating,
} = useApiLazy(() => `/${permissionTableName.value}`, {
  method: "post",
  errorContext: "Create Permission",
});

const {
  error: updateError,
  execute: updatePermission,
  pending: updating,
} = useApiLazy(() => `/${permissionTableName.value}`, {
  method: "patch",
  errorContext: "Update Permission",
});

const {
  error: deleteError,
  execute: deletePermissionApi,
  pending: deletePending,
} = useApiLazy(() => `/${permissionTableName.value}`, {
  method: "delete",
  errorContext: "Delete Permission",
});

// Computed
const permissions = computed(() => permissionsData.value?.data || []);
const saving = computed(() => creating.value || updating.value);

// Methods
function createNewPermission() {
  isEditing.value = false;
  currentPermission.value = null;

  // Generate empty form from schema
  permissionForm.value = generateEmptyForm();

  // Set current field ID if provided
  if (props.currentFieldId) {
    permissionForm.value[props.currentFieldId.field] = {
      id: props.currentFieldId.value,
    };
  }

  permissionErrors.value = {};
  showDrawer.value = true;
}

function editPermission(permission: Permission) {
  isEditing.value = true;
  currentPermission.value = permission;
  permissionForm.value = { ...permission };
  permissionErrors.value = {};
  showDrawer.value = true;
}

function closeDrawer() {
  showDrawer.value = false;
  currentPermission.value = null;
  permissionForm.value = {};
  permissionErrors.value = {};
}

async function savePermission() {
  try {
    if (isEditing.value && currentPermission.value) {
      // Update existing permission
      await updatePermission({
        body: permissionForm.value,
        id: currentPermission.value.id,
      });
    } else {
      // Create new permission
      await createPermission({
        body: permissionForm.value,
      });
    }

    // Refresh permissions list
    await fetchPermissions();

    // Close drawer
    closeDrawer();

    // Show success message
    const toast = useToast();
    toast.add({
      title: "Success",
      description: `Permission ${
        isEditing.value ? "updated" : "created"
      } successfully!`,
      color: "success",
    });
  } catch (error) {
    console.error("Error saving permission:", error);
  }
}

async function deletePermission(permission: Permission) {
  const confirmed = await confirm({
    title: "Delete Permission",
    content:
      "Are you sure you want to delete this permission? This action cannot be undone.",
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (!confirmed) return;

  try {
    deleting.value = permission.id;
    await deletePermissionApi({ id: permission.id });

    toast.add({
      title: "Permission Deleted",
      description: "Permission has been deleted successfully",
      color: "success",
    });

    await fetchPermissions();
  } catch (error) {
    console.error("Error deleting permission:", error);
    toast.add({
      title: "Error",
      description: "Failed to delete permission",
      color: "error",
    });
  } finally {
    deleting.value = null;
  }
}

// Lifecycle
onMounted(() => {
  fetchPermissions();
});
</script>
