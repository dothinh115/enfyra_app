export function useSchema(tableName?: string | Ref<string>) {
  const schemas = useState<any>("schemas:data", () => ({}));
  
  // Watch tables from useGlobalState and auto-update schemas
  const { tables } = useGlobalState();
  watch(tables, (newTables) => {
    if (newTables && newTables.length > 0) {
      updateSchemas(newTables);
    }
  }, { immediate: true, deep: true });
  
  function convertToEnfyraSchema(input: any[]): Record<string, any> {
    const schema: Record<string, any> = {};
    const seenRelationKeys = new Set<string>();

    for (const t of input) {
      schema[t.name] = {
        ...t,
        definition: [],
      };
      delete schema[t.name].columns;
      delete schema[t.name].relations;
    }

    for (const t of input) {
      for (const col of t.columns || []) {
        schema[t.name].definition.push({
          ...col,
          fieldType: "column",
        });
      }
    }

    for (const tableName in schema) {
      const def = schema[tableName].definition;

      const shouldInject = (name: string) =>
        !def.some((d: any) => d.name === name && d.fieldType === "column");

      if (shouldInject("createdAt")) {
        def.push({
          name: "createdAt",
          type: "timestamp",
          isNullable: false,
          isSystem: true,
          isUpdatable: false,
          isHidden: false,
          fieldType: "column",
          isVirtual: true,
        });
      }

      if (shouldInject("updatedAt")) {
        def.push({
          name: "updatedAt",
          type: "timestamp",
          isNullable: false,
          isSystem: true,
          isUpdatable: false,
          isHidden: false,
          fieldType: "column",
          isVirtual: true,
        });
      }
    }

    for (const t of input) {
      for (const rel of t.relations || []) {
        const sourceTable = t.name;
        if (!rel.propertyName || !rel.targetTable || !rel.sourceTable) continue;

        const directKey = `${sourceTable}:${rel.propertyName}`;
        if (!seenRelationKeys.has(directKey)) {
          schema[sourceTable].definition.push({
            ...rel,
            name: rel.propertyName,
            fieldType: "relation",
          });
          seenRelationKeys.add(directKey);
        }

        if (rel.inversePropertyName) {
          const targetTableName = input.find(
            (t) => t.id === rel.targetTable.id
          )?.name;
          const inverseKey = `${targetTableName}:${rel.inversePropertyName}`;
          if (!seenRelationKeys.has(inverseKey)) {
            const inverseRel = {
              ...rel,
              name: rel.inversePropertyName,
              propertyName: rel.inversePropertyName,
              inversePropertyName: rel.propertyName,
              sourceTable: rel.targetTable,
              targetTable: rel.sourceTable,
              type: inverseRelationType(rel.type),
              fieldType: "relation",
              isNullable: true,
            };
            delete inverseRel.id;
            schema[targetTableName].definition.push(inverseRel);
            seenRelationKeys.add(inverseKey);
          }
        }
      }
    }

    return schema;
  }

  function inverseRelationType(type: string): string {
    switch (type) {
      case "one-to-many":
        return "many-to-one";
      case "many-to-one":
        return "one-to-many";
      default:
        return type;
    }
  }

  function updateSchemas(tables: any[]) {
    schemas.value = convertToEnfyraSchema(tables);
  }

  // Table-specific functionality (only when tableName is provided)
  const tableNameRef = tableName ? (isRef(tableName) ? tableName : ref(tableName)) : ref("");

  const definition = computed(
    () => schemas.value[tableNameRef.value]?.definition || []
  );

  function sortFieldsByOrder(fields: any[]): any[] {
    return [...fields].sort((a: any, b: any) => {
      if (a.fieldType === "column" && b.fieldType === "relation") return -1;
      if (a.fieldType === "relation" && b.fieldType === "column") return 1;
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

    return sortFieldsByOrder(fields);
  });

  function generateEmptyForm(options?: {
    excluded?: string[];
  }): Record<string, any> {
    const { excluded = [] } = options || {};
    const result: Record<string, any> = {};

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

      const nullable = field.isNullable ?? true;
      if (nullable) {
        result[key] = null;
        continue;
      }

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

  // If tableName provided, return single table schema
  const tableSchema = computed(() => {
    if (!tableName) return null;
    return schemas.value[tableNameRef.value] || null;
  });

  return {
    // Schema data
    schemas: tableName ? tableSchema : readonly(schemas), // Return single table if tableName, all if not
    updateSchemas,
    
    // Table-specific functions (only useful when tableName is provided)
    definition,
    fieldMap,
    generateEmptyForm,
    validate,
    getIncludeFields,
    sortFieldsByOrder,
    useFormChanges,
  };
}
