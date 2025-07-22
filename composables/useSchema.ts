import { computed } from "vue";
import { useGlobalState } from "@/composables/useGlobalState";

export function useSchema(tableName: string) {
  const { schemas } = useGlobalState();

  const definition = computed(() => schemas.value[tableName]?.definition || []);

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

  // Những field đủ điều kiện render trong form
  const editableFields = computed(() =>
    definition.value.filter((field: any) => {
      const key = field.name || field.propertyName;
      if (!key) return false;
      if (
        ["id", "createdAt", "updatedAt", "isSystem", "isRootAdmin"].includes(
          key
        )
      )
        return false;
      return true;
    })
  );

  function generateEmptyForm(options?: {
    excluded?: string[];
  }): Record<string, any> {
    const { excluded = [] } = options || {};
    const result: Record<string, any> = {};

    for (const field of editableFields.value) {
      const key = field.name || field.propertyName;
      if (!key || excluded.includes(key)) continue;

      // Ưu tiên defaultValue nếu có
      if (field.defaultValue !== undefined) {
        result[key] = field.defaultValue;
        continue;
      }

      // Nếu là relation
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

      // Nếu nullable
      const nullable = field.isNullable ?? true;
      if (nullable) {
        result[key] = null;
        continue;
      }

      // Field thường (không nullable, không default)
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

      const empty =
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "");

      if (!nullable && empty) {
        errors[key] = "Trường này là bắt buộc";
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

  return {
    definition,
    fieldMap,
    generateEmptyForm,
    validate,
    getIncludeFields,
  };
}
