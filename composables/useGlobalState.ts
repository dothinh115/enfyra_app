export const useGlobalState = () => {
  const tables = useState<any[]>("global:tables", () => []);
  const routes = useState<any[]>("global:routes", () => []);
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

  return {
    tables,
    routes,
    tableForm,
    fetchTable,
    fetchRoute,
    tableFormLoading,
  };
};
