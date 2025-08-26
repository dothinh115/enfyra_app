import { ref, computed, watch } from 'vue';

export function useDataTableVisibility(tableName: string, schemas: any) {
  // Column visibility state with localStorage support - save hidden columns instead of visible
  const hiddenColumns = ref<Set<string>>(new Set());

  // Computed to get visible columns from hidden columns
  const visibleColumns = computed(() => {
    const schema = schemas.value[tableName];
    if (!schema?.definition) return new Set();

    const columnFields = schema.definition
      .filter((field: any) => field.fieldType === "column")
      .map((field: any) => field.name);

    // Visible = all columns minus hidden columns
    return new Set(
      columnFields.filter((field: string) => !hiddenColumns.value.has(field))
    );
  });

  // Load saved column visibility from localStorage
  const loadColumnVisibility = (
    tableName: string,
    columnFields: string[]
  ): Set<string> => {
    try {
      const saved = localStorage.getItem(`columnVisibility_${tableName}`);
      if (saved) {
        const savedHiddenColumns = JSON.parse(saved);
        // Only include hidden columns that still exist in the schema
        const validHiddenColumns = savedHiddenColumns.filter((col: string) =>
          columnFields.includes(col)
        );
        return new Set(validHiddenColumns);
      }
    } catch (error) {
      console.warn("Failed to load column visibility from localStorage:", error);
    }
    // Default: no columns hidden (all visible)
    return new Set();
  };

  // Save column visibility to localStorage
  const saveColumnVisibility = (tableName: string, hiddenCols: Set<string>) => {
    try {
      localStorage.setItem(
        `columnVisibility_${tableName}`,
        JSON.stringify(Array.from(hiddenCols))
      );
    } catch (error) {
      console.warn("Failed to save column visibility to localStorage:", error);
    }
  };

  // Initialize visible columns when schema changes
  watch(
    () => schemas.value[tableName],
    (schema) => {
      if (schema?.definition) {
        const columnFields = schema.definition
          .filter((field: any) => field.fieldType === "column")
          .map((field: any) => field.name);

        // Load from localStorage or default to no hidden columns (all visible)
        hiddenColumns.value = loadColumnVisibility(tableName, columnFields);
      }
    },
    { immediate: true }
  );

  // Toggle column visibility (called when user clicks Apply)
  function toggleColumnVisibility(columnName: string) {
    if (hiddenColumns.value.has(columnName)) {
      hiddenColumns.value.delete(columnName); // Show column
    } else {
      hiddenColumns.value.add(columnName); // Hide column
    }

    // Trigger reactivity
    hiddenColumns.value = new Set(hiddenColumns.value);

    // Save to localStorage
    saveColumnVisibility(tableName, hiddenColumns.value);
  }

  // Column visibility dropdown items
  const columnDropdownItems = computed(() => {
    const schema = schemas.value[tableName];
    if (!schema?.definition) return [];

    const items = schema.definition
      .filter((field: any) => field.fieldType === "column")
      .map((field: any) => ({
        label: field.label || field.name,
        type: "checkbox" as const,
        get checked() {
          return !hiddenColumns.value.has(field.name); // checked = not hidden
        },
        onToggle: () => {
          toggleColumnVisibility(field.name);
        },
      }));

    return items;
  });

  return {
    hiddenColumns,
    visibleColumns,
    toggleColumnVisibility,
    columnDropdownItems
  };
}