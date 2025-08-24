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
      type: "select",
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
    ...(currentType === "array-select" && {
      options: {
        type: "array-tags",
      },
    }),
    // Exclude options field khi không phải array-select
    ...(currentType !== "array-select" && {
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
      class="flex items-center justify-between rounded-lg border border-muted hover:bg-muted/50 transition"
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
        class="hover:cursor-pointer mr-2"
        @click.stop="columns.splice(index, 1)"
      />
    </div>

    <!-- Add column -->
    <div class="flex justify-end pt-2">
      <UButton icon="lucide:plus" label="Add Column" @click="addNewColumn()" />
    </div>
  </div>

  <!-- Edit Column Modal -->
  <Teleport to="body">
    <UModal
      v-model:open="isEditing"
      v-if="currentColumn"
      close-icon="i-lucide-arrow-right"
    >
      <!-- Modal Header -->
      <template #header>
        <div class="flex justify-between items-center w-full">
          <div class="text-base font-semibold">
            {{ editingIndex !== null ? "Edit Column: " : "" }}
            {{ currentColumn?.name || "New Column" }}
          </div>
          <UButton
            icon="lucide:x"
            color="error"
            variant="soft"
            @click="
              isEditing = false;
              currentColumn = null;
            "
          >
            Cancel
          </UButton>
        </div>
      </template>

      <!-- Modal Body -->
      <template #body>
        <FormEditorLazy
          v-model="currentColumn"
          tableName="column_definition"
          v-model:errors="errors"
          :includes="currentColumn.name === 'id' ? ['name', 'type'] : undefined"
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
      </template>

      <!-- Modal Footer -->
      <template #footer>
        <div class="flex w-full space-x-2 justify-end">
          <UButton
            icon="lucide:check"
            label="Save"
            @click="saveColumn()"
            color="primary"
          />
        </div>
      </template>
    </UModal>
  </Teleport>
</template>
