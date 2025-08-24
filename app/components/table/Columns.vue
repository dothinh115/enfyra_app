<script setup lang="ts">
const props = defineProps<{
  modelValue: any[];
}>();

const isEditing = ref(false);
const editingIndex = ref<number | null>(null);
const currentColumn = ref<any>(null);
const columns = useModel(props, "modelValue");
const isNew = ref(false);
const errors = ref<Record<string, string>>({});

const { generateEmptyForm } = useSchema("column_definition");

function createEmptyColumn(): any {
  return generateEmptyForm();
}

function editColumn(col: any, index: number) {
  isEditing.value = true;

  if (!col) return;
  editingIndex.value = index;
  currentColumn.value = { ...toRaw(col) };

  // Nếu type là uuid, đảm bảo isGenerated = true và không có defaultValue
  if (currentColumn.value.type === "uuid") {
    currentColumn.value.isGenerated = true;
    delete currentColumn.value.defaultValue;
  }
}

function saveColumn() {
  validate();
  validate("name");
  if (Object.keys(errors.value).length > 0) return;

  const newCol = { ...currentColumn.value };

  // Đảm bảo uuid type luôn có isGenerated = true và không có defaultValue
  if (newCol.type === "uuid") {
    newCol.isGenerated = true;
    delete newCol.defaultValue;
  }

  if (isNew.value) {
    columns.value.push(newCol);
  } else if (editingIndex.value != null) {
    columns.value.splice(editingIndex.value, 1, newCol);
  }

  isEditing.value = false;
  isNew.value = false;
  currentColumn.value = null;
  editingIndex.value = null;
}

function addNewColumn() {
  isNew.value = true;
  isEditing.value = true;
  currentColumn.value = createEmptyColumn();
  currentColumn.value.isNullable = true;
  currentColumn.value.isUpdatable = true;
  editingIndex.value = null;
  delete currentColumn.value.id;

  // Nếu type là uuid, tự động set isGenerated = true
  if (currentColumn.value.type === "uuid") {
    currentColumn.value.isGenerated = true;
    delete currentColumn.value.defaultValue;
  }
}

function validate(property?: string) {
  if (property === "name") {
    if (!currentColumn.value?.name?.trim()) {
      errors.value.name = "Column name is required";
    } else if (!TABLE_NAME_FIELD_REGEX.test(currentColumn.value?.name)) {
      errors.value.name =
        "Only letters, numbers, _ allowed and cannot start with number or _!";
    } else {
      delete errors.value.name;
    }
    return;
  }

  if (!currentColumn.value?.type) {
    errors.value.type = "Must select data type";
  } else delete errors.value.type;

  if (
    !currentColumn.value?.isNullable &&
    !currentColumn.value?.isGenerated &&
    !currentColumn.value?.defaultValue
  ) {
    errors.value.defaultValue = "Cannot be empty!";
  } else delete errors.value.defaultValue;
}

function getDefaultValueType(columnType: string) {
  if (!columnType) return { type: "text" };

  // Boolean type
  if (columnType === "boolean") {
    return { type: "boolean" };
  }

  // Numeric types
  if (columnType === "int" || columnType === "float") {
    return { type: "number" };
  }

  // Date type
  if (columnType === "date") {
    return {
      type: "date",
      fieldProps: {
        class: "col-span-2",
      },
    };
  }

  // Long text types
  if (columnType === "text" || columnType === "richtext") {
    return { type: "textarea" };
  }

  // Code type
  if (columnType === "code") {
    return { type: "code" };
  }

  if (columnType === "varchar" || columnType === "uuid") {
    return { type: "text" };
  }

  // Default fallback
  return { type: "text" };
}

const typeMap = computed(() => {
  const currentType = currentColumn.value?.type;

  return {
    type: {
      type: "enum",
      options:
        currentColumn.value?.name === "id"
          ? columnTypes.filter((colType) =>
              ["uuid", "int"].includes(colType.value)
            )
          : columnTypes,
    },
    name: {
      disabled: currentColumn.value?.name === "id",
    },
    defaultValue: getDefaultValueType(currentType),
    // Xử lý đặc biệt cho uuid type
    ...(currentType === "uuid" && {
      defaultValue: {
        type: "text",
        disabled: true,
        placeholder: "Auto-generated UUID",
      },
      isGenerated: {
        type: "boolean",
        disabled: true,
        default: true,
      },
    }),
    // Xử lý đặc biệt cho array-select type
    ...(["array-select", "enum"].includes(currentType) && {
      options: {
        type: "array-tags",
      },
    }),

    // Exclude options field khi không phải array-select
    ...(!["array-select", "enum"].includes(currentType) && {
      options: {
        excluded: true,
      },
    }),
  };
});

onMounted(() => {
  const primaryColumn = createEmptyColumn();
  primaryColumn.name = "id";
  primaryColumn.type = "int";
  primaryColumn.isPrimary = true;
  primaryColumn.isGenerated = true;
  primaryColumn.isNullable = false;
  delete primaryColumn.id;
  if (!columns.value.length) columns.value.push(primaryColumn);
});

// Watcher để xử lý uuid type
watch(
  () => currentColumn.value?.type,
  (newType, oldType) => {
    if (newType === "uuid" && oldType !== "uuid") {
      // Khi type thay đổi thành uuid
      if (currentColumn.value) {
        currentColumn.value.isGenerated = true;
        delete currentColumn.value.defaultValue;
      }
    } else if (oldType === "uuid" && newType !== "uuid") {
      // Khi type thay đổi từ uuid sang type khác
      if (currentColumn.value) {
        currentColumn.value.isGenerated = false;
        // Khôi phục lại defaultValue dựa trên type mới
        const defaultValueType = getDefaultValueType(newType);
        if (defaultValueType) {
          currentColumn.value.defaultValue = null;
        }
      }
    }
  }
);
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2 text-lg font-semibold text-muted">
      <UIcon name="lucide:columns" class="w-5 h-5" />
      Columns
    </div>
    <div
      v-for="(column, index) in columns"
      :key="column.id ?? index"
      class="flex items-center justify-between rounded-lg border border-muted lg:hover:bg-muted/50 transition"
    >
      <!-- Click section to edit -->
      <div
        class="flex items-center gap-2 flex-1 cursor-pointer px-4 py-3"
        @click="editColumn(column, index)"
      >
        <UIcon name="lucide:type" class="w-4 h-4 text-muted-foreground" />
        <span class="text-sm font-medium">
          {{ column.name || "Unnamed" }}
        </span>

        <UBadge size="xs" color="info" v-if="column.type">
          {{ column.type }}
        </UBadge>
        <UBadge size="xs" color="info" v-if="column.isNullable"
          >nullable</UBadge
        >
        <UBadge size="xs" color="info" v-if="column.isIndex">index</UBadge>
      </div>

      <!-- Delete button -->
      <UButton
        icon="lucide:trash"
        color="error"
        variant="ghost"
        size="xs"
        :disabled="column.isSystem || column.isPrimary"
        class="lg:hover:cursor-pointer mr-2"
        @click.stop="columns.splice(index, 1)"
      />
    </div>

    <!-- Add column -->
    <div class="flex justify-end pt-2">
      <UButton icon="lucide:plus" label="Add Column" @click="addNewColumn()" />
    </div>
  </div>

  <!-- Edit Column Drawer -->
  <Teleport to="body">
    <UDrawer
      v-model:open="isEditing"
      direction="right"
      class="min-w-xl"
      :ui="{
        header:
          'border-b border-muted text-muted pb-2 flex items-center justify-between',
      }"
    >
      <template #header>
        <div
          class="bg-gradient-to-r from-background/90 to-muted/20 rounded-t-xl w-full"
        >
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg"
              >
                <UIcon name="lucide:columns" class="text-sm text-white" />
              </div>
              <div>
                <h2 class="text-xl font-semibold text-foreground">
                  {{ editingIndex !== null ? "Edit Column" : "New Column" }}
                </h2>
                <p class="text-sm text-muted-foreground">
                  {{ currentColumn?.name || "Configure column properties" }}
                </p>
              </div>
            </div>
            <UButton
              icon="lucide:x"
              @click="
                isEditing = false;
                currentColumn = null;
              "
              variant="soft"
              color="error"
              size="lg"
              class="lg:hover:bg-error/10 lg:hover:text-error transition-colors duration-200"
            />
          </div>
        </div>
      </template>

      <template #body>
        <div class="space-y-6" v-if="currentColumn">
          <!-- Form Section -->
          <div
            class="bg-gradient-to-r from-background/50 to-muted/10 rounded-xl border border-muted/30 p-6"
          >
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="lucide:edit-3" class="text-info" size="18" />
              <h3 class="text-lg font-semibold text-foreground">
                Column Properties
              </h3>
            </div>
            <FormEditorLazy
              v-model="currentColumn"
              tableName="column_definition"
              v-model:errors="errors"
              :includes="
                currentColumn.name === 'id' ? ['name', 'type'] : undefined
              "
              :excluded="[
                'isSystem',
                'id',
                'createdAt',
                'updatedAt',
                'isPrimary',
                'table',
              ]"
              :type-map="typeMap"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <!-- Actions Section -->
        <div
          class="bg-gradient-to-r from-muted/10 to-background/50 rounded-xl border border-muted/30 p-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon
                name="lucide:info"
                class="text-muted-foreground"
                size="16"
              />
              <span class="text-sm text-muted-foreground">
                {{
                  editingIndex !== null
                    ? "Ready to update column?"
                    : "Ready to create new column?"
                }}
              </span>
            </div>
            <div class="flex gap-3">
              <UButton
                variant="ghost"
                color="neutral"
                @click="
                  isEditing = false;
                  currentColumn = null;
                "
                :disabled="false"
              >
                Cancel
              </UButton>
              <UButton
                icon="lucide:check"
                @click="saveColumn()"
                color="primary"
                :loading="false"
              >
                {{ editingIndex !== null ? "Update Column" : "Create Column" }}
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UDrawer>
  </Teleport>
</template>
