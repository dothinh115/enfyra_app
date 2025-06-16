export const useGlobalState = () => {
  const tables = useState<any[]>("global:tables", () => []);
  const routes = useState<any[]>("global:routes", () => []);
  const columns = useState<any[]>("global:columns", () => []);
  const relations = useState<any[]>("global:relations", () => []);
  const settings = useState<any>("global:settings", () => {});
  const tableForm = useState<any>("tableForm", () => null);
  const tableFormLoading = useState<boolean>("tableForm:loading", () => false);

  const toast = useToast();

  async function fetchTable() {
    const fieldArr = ["*", "columns.*", "relations.*"];
    const fields = fieldArr.join(",");
    try {
      const { data } = await useApi("/table_definition", {
        query: { fields, limit: 0 },
      });
      tables.value = data.value.data;
      console.log(tables.value);
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Cannot fetch tables...",
        color: "error",
      });
    }
  }

  async function fetchRoute() {
    const fieldArr = [
      "*",
      "mainTable.*",
      "routePermissions.*",
      "handlers.*",
      "middlewares.*",
      "hooks.*",
    ];
    const fields = fieldArr.join(",");
    try {
      const { data } = await useApi("/route_definition", {
        query: { fields, limit: 0 },
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
      console.log(columns.value);
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
    const fieldArr = ["*"];
    const fields = fieldArr.join(",");
    try {
      const { data } = await useApi("/setting_definition", {
        query: { fields, limit: 0 },
      });
      settings.value = data.value.data[0];
      console.log(data.value.data);
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Cannot fetch settings...",
        color: "error",
      });
    }
  }

  async function fetchSchema() {
    return await Promise.all([
      fetchTable(),
      fetchRelation(),
      fetchRoute(),
      fetchColumn(),
      fetchSetting(),
    ]);
  }

  return {
    tables,
    routes,
    columns,
    settings,
    relations,
    tableForm,
    tableFormLoading,
    fetchSchema,
  };
};
