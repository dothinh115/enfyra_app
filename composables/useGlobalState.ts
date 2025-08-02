export const useGlobalState = () => {
  const tables = useState<any[]>("global:tables", () => []);
  const routes = useState<any[]>("global:routes", () => []);
  const columns = useState<any[]>("global:columns", () => []);
  const relations = useState<any[]>("global:relations", () => []);
  const settings = useState<any>("global:settings", () => {});
  const globalForm = useState<any>("global:form", () => null);
  const globalFormLoading = useState<boolean>(
    "global:form:loading",
    () => false
  );
  const globalLoading = useState<boolean>(
    "global:loading",
    () => false
  );
  const routeLoading = useState<boolean>(
    "global:route:loading",
    () => false
  );
  const buttonLoadingStates = useState<Record<string, boolean>>(
    "global:button:loading",
    () => ({})
  );
  const schemas = useState<any>("global:schemas", () => []);

  const toast = useToast();

  async function fetchTable() {
    const fields = ["*", "columns.*", "relations.*"].join(",");
    const sort = ["id"].join(",");
    try {
      const { data } = await useApi("/table_definition", {
        query: { fields, limit: 0, sort },
      });
      tables.value = data.value.data;
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Cannot fetch tables...",
        color: "error",
      });
    }
  }

  async function fetchRoute() {
    const fields = [
      "*",
      "mainTable.*",
      "routePermissions.*",
      "handlers.*",
      "hooks.*",
    ].join(",");
    const sort = ["id"].join(",");

    try {
      const { data } = await useApi("/route_definition", {
        query: { fields, limit: 0, sort },
      });
      routes.value = data.value.data;
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Cannot fetch routes...",
        color: "error",
      });
    }
  }

  async function fetchColumn() {
    const fieldArr = ["*"];
    const fields = fieldArr.join(",");
    try {
      const { data } = await useApi("/column_definition", {
        query: { fields, limit: 0 },
      });
      columns.value = data.value.data;
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Cannot fetch columns...",
        color: "error",
      });
    }
  }

  async function fetchRelation() {
    const fieldArr = ["*"];
    const fields = fieldArr.join(",");
    try {
      const { data } = await useApi("/relation_definition", {
        query: { fields, limit: 0 },
      });
      relations.value = data.value.data;
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Cannot fetch relations...",
        color: "error",
      });
    }
  }

  async function fetchSetting() {
    const fieldArr = ["*", "methods.*"];
    const fields = fieldArr.join(",");
    try {
      const { data } = await useApi("/setting_definition", {
        query: { fields, limit: 0 },
      });
      settings.value = data.value.data[0];
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Cannot fetch settings...",
        color: "error",
      });
    }
  }

  async function fetchSchema() {
    globalLoading.value = true;
    await Promise.all([
      fetchTable(),
      fetchRelation(),
      fetchRoute(),
      fetchColumn(),
      fetchSetting(),
    ]);
    schemas.value = convertToEnfyraSchema(tables.value);
    globalLoading.value = false;
  }

  function convertToEnfyraSchema(input: any[]): Record<string, any> {
    const schema: Record<string, any> = {};
    const seenRelationKeys = new Set<string>();

    // 1. Chuẩn hóa bảng
    for (const t of input) {
      schema[t.name] = {
        ...t,
        definition: [],
      };
      delete schema[t.name].columns;
      delete schema[t.name].relations;
    }

    // 2. Columns
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

    // 3. Relations + inverse
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

        // Nếu có inverse → sinh chiều ngược lại với target giữ nguyên định dạng object
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

  function setButtonLoading(buttonId: string, loading: boolean) {
    buttonLoadingStates.value = {
      ...buttonLoadingStates.value,
      [buttonId]: loading
    };
  }

  function getButtonLoading(buttonId: string): boolean {
    return buttonLoadingStates.value[buttonId] || false;
  }

  function setRouteLoading(loading: boolean) {
    routeLoading.value = loading;
  }

  return {
    tables,
    routes,
    columns,
    settings,
    relations,
    schemas,
    globalForm,
    globalFormLoading,
    globalLoading,
    routeLoading,
    buttonLoadingStates,
    fetchSchema,
    setButtonLoading,
    getButtonLoading,
    setRouteLoading,
  };
};
