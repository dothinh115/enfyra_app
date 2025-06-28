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
      "middlewares.*",
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
    const fieldArr = ["*"];
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
    globalForm,
    globalFormLoading,
    fetchSchema,
  };
};
