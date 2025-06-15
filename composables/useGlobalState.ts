export const useGlobalState = () => {
  const tables = useState<any[]>("global:tables", () => []);
  const routes = useState<any[]>("global:routes", () => []);

  const toast = useToast();

  async function fetchTable() {
    const fieldArr = ["*", "columns.*", "relations.*"];
    const fields = fieldArr.join(",");
    try {
      const { data } = await useApi("/table_definition", { query: { fields } });
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
      const { data } = await useApi("/route_definition", { query: { fields } });
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
    fetchTable,
    fetchRoute,
  };
};
