export const useGlobalState = () => {
  const tables = useState<any[]>("global:tables", () => []);
  const routes = useState<any[]>("global:routes", () => []);
  const settings = useState<any>("global:settings", () => {});
  const globalLoading = useState<boolean>("global:loading", () => false);

  const schemas = useState<any>("global:schemas", () => []);
  const sidebarVisible = useState<boolean>(
    "global:sidebar:visible",
    () => true
  );
  const routeLoading = useState<boolean>("global:route:loading", () => false);

  const toast = useToast();

  // API composable for fetching tables
  const { data: tablesData, execute: executeFetchTables } = useApiLazy(
    () => "/table_definition",
    {
      query: {
        fields: ["*", "columns.*", "relations.*"].join(","),
        limit: 0,
        sort: ["id"].join(","),
      },
      errorContext: "Fetch Tables",
    }
  );

  async function fetchTable() {
    try {
      await executeFetchTables();
      tables.value = tablesData.value?.data || [];
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Cannot fetch tables...",
        color: "error",
      });
    }
  }

  // API composable for fetching routes
  const { data: routesData, execute: executeFetchRoutes } = useApiLazy(
    () => "/route_definition",
    {
      query: {
        fields: [
          "*",
          "mainTable.*",
          "routePermissions.*",
          "handlers.*",
          "hooks.*",
        ].join(","),
        limit: 0,
        sort: ["id"].join(","),
      },
      errorContext: "Fetch Routes",
    }
  );

  async function fetchRoute() {
    try {
      await executeFetchRoutes();
      routes.value = routesData.value?.data || [];
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Cannot fetch routes...",
        color: "error",
      });
    }
  }

  // API composable for fetching settings
  const { data: settingsData, execute: executeFetchSettings } = useApiLazy(
    () => "/setting_definition",
    {
      query: {
        fields: ["*", "methods.*"].join(","),
        limit: 0,
      },
      errorContext: "Fetch Settings",
    }
  );

  async function fetchSetting() {
    try {
      await executeFetchSettings();
      settings.value = settingsData.value?.data[0] || {};
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
    await Promise.all([fetchTable(), fetchRoute(), fetchSetting()]);
    schemas.value = convertToEnfyraSchema(tables.value);
    globalLoading.value = false;
  }

  function convertToEnfyraSchema(input: any[]): Record<string, any> {
    const schema: Record<string, any> = {};
    const seenRelationKeys = new Set<string>();

    // 1. Normalize tables
    for (const t of input) {
      schema[t.name] = {
        ...t,
        definition: [],
      };
      delete schema[t.name].columns;
      delete schema[t.name].relations;
    }

    // 2. Process columns
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

    // 3. Process relations and inverses
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

        // If has inverse → generate reverse relation with target keeping object format
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

  function toggleSidebar() {
    sidebarVisible.value = !sidebarVisible.value;
  }

  function setSidebarVisible(visible: boolean) {
    sidebarVisible.value = visible;
  }

  function setRouteLoading(loading: boolean) {
    routeLoading.value = loading;
  }

  return {
    tables,
    schemas,
    globalLoading,
    fetchSchema,
    sidebarVisible,
    toggleSidebar,
    setSidebarVisible,
    setRouteLoading,
  };
};
