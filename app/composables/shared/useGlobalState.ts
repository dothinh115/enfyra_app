export const useGlobalState = () => {
  const tables = useState<any[]>("global:tables", () => []);
  const settings = useState<any>("global:settings", () => {});

  const sidebarVisible = useState<boolean>(
    "global:sidebar:visible",
    () => true
  );
  const routeLoading = useState<boolean>("global:route:loading", () => false);

  const {
    data: tablesData,
    pending: tablesPending,
    execute: executeFetchTables,
  } = useApiLazy(() => "/table_definition", {
    query: {
      fields: ["*", "columns.*", "relations.*"].join(","),
      limit: 0,
      sort: ["id"].join(","),
    },
    errorContext: "Fetch Tables",
  });

  async function fetchTable() {
    await executeFetchTables();
    tables.value = tablesData.value?.data || [];
  }

  // API composable for fetching settings
  const {
    data: settingsData,
    pending: settingsPending,
    execute: executeFetchSettings,
  } = useApiLazy(() => "/setting_definition", {
    query: {
      fields: ["*", "methods.*"].join(","),
      limit: 0,
    },
    errorContext: "Fetch Settings",
  });

  async function fetchSetting() {
    await executeFetchSettings();
    settings.value = settingsData.value?.data[0] || {};
  }

  async function fetchSchema() {
    await fetchTable();
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
    settings,
    fetchSchema,
    fetchSetting,
    schemaLoading: tablesPending,
    sidebarVisible,
    routeLoading,
    toggleSidebar,
    setSidebarVisible,
    setRouteLoading,
  };
};
