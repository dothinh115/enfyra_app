// useGlobalState is auto-imported

export function useSchema(tableName: string) {
  const { schemas } = useGlobalState();

  const definition = computed(() => schemas.value[tableName]?.definition || []);

  // Helper function to sort fields by standard order
  function sortFieldsByOrder(fields: any[]): any[] {
    return [...fields].sort((a: any, b: any) => {
      // First priority: fieldType (columns before relations)
      if (a.fieldType === "column" && b.fieldType === "relation") return -1;
      if (a.fieldType === "relation" && b.fieldType === "column") return 1;

      // Second priority: if both are same type, maintain original order
      return 0;
    });
  }

  const fieldMap = computed(() => {
    const map = new Map<string, any>();
    for (const field of definition.value) {
      const key = field.name || field.propertyName;
      if (key) map.set(key, field);
    }
    return map;
  });

  function getField(key: string) {
    return fieldMap.value.get(key);
  }

  // Fields eligible to be rendered in form
  const editableFields = computed(() => {
    let fields = definition.value.filter((field: any) => {
      const key = field.name || field.propertyName;
      if (!key) return false;
      if (
        ["id", "createdAt", "updatedAt", "isSystem", "isRootAdmin"].includes(
          key
        )
      )
        return false;
      return true;
    });

    // Sort fields using helper function
    return sortFieldsByOrder(fields);
  });

  function generateEmptyForm(options?: {
    excluded?: string[];
  }): Record<string, any> {
    const { excluded = [] } = options || {};
    const result: Record<string, any> = {};

    // Thêm các field cần loại bỏ mặc định
    const defaultExcluded = [
      "createdAt",
      "updatedAt",
      "id",
      "isSystem",
      "isRootAdmin",
    ];
    const allExcluded = [...defaultExcluded, ...excluded];

    for (const field of editableFields.value) {
      const key = field.name || field.propertyName;
      if (!key || allExcluded.includes(key)) continue;

      if (field.defaultValue !== undefined) {
        result[key] = field.defaultValue;
        continue;
      }

      // If it's a relation
      if (field.fieldType === "relation" || field.relationType) {
        switch (field.relationType) {
          case "one-to-many":
          case "many-to-many":
            result[key] = [];
            break;
          case "many-to-one":
          case "one-to-one":
          default:
            result[key] = null;
            break;
        }
        continue;
      }

      // If nullable
      const nullable = field.isNullable ?? true;
      if (nullable) {
        result[key] = null;
        continue;
      }

      // Regular field (not nullable, no default)
      switch (field.type) {
        case "boolean":
          result[key] = false;
          break;
        case "array":
          result[key] = [];
          break;
        case "int":
        case "number":
          result[key] = 0;
          break;
        default:
          result[key] = "";
      }
    }

    return result;
  }

  function validate(record: Record<string, any>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const [key, value] of Object.entries(record)) {
      const field = getField(key);
      if (!field) continue;

      const isRelation = field.fieldType === "relation";
      const isInverse = isRelation && !!field.inversePropertyName;
      if (isInverse) continue;

      const nullable = field.isNullable ?? true;
      const isGenerated = field.isGenerated === true;

      const empty =
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "");

      // Only validate as required if field is not nullable AND not auto-generated
      if (!nullable && !isGenerated && empty) {
        errors[key] = "This field is required";
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  function getIncludeFields(): string {
    if (!definition.value.length) return "*";

    const relations = definition.value
      .filter((field: any) => field.fieldType === "relation")
      .map((field: any) => `${field.propertyName}.*`);

    return ["*", ...relations].join(",");
  }

  // Form change detection
  function useFormChanges() {
    const originalData = ref<Record<string, any>>({});
    const hasChanges = ref(false);

    function update(newData: Record<string, any>) {
      originalData.value = JSON.parse(JSON.stringify(newData));
      hasChanges.value = false;
    }

    function checkChanges(currentData: Record<string, any>) {
      // Deep comparison between original and current data
      const original = JSON.stringify(originalData.value);
      const current = JSON.stringify(currentData);
      hasChanges.value = original !== current;
      return hasChanges.value;
    }

    return {
      originalData: readonly(originalData),
      hasChanges: readonly(hasChanges),
      update,
      checkChanges,
    };
  }

  return {
    definition,
    fieldMap,
    generateEmptyForm,
    validate,
    getIncludeFields,
    sortFieldsByOrder, // Export helper function for external use
    useFormChanges, // Form change tracking
  };
}
