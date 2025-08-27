export const useGlobalState = () => {
  const tables = useState<any[]>("global:tables", () => []);
  const routes = useState<any[]>("global:routes", () => []);
  const settings = useState<any>("global:settings", () => {});

  const sidebarVisible = useState<boolean>(
    "global:sidebar:visible",
    () => true
  );
  const routeLoading = useState<boolean>("global:route:loading", () => false);
  const { updateSchemas, schemas } = useSchema();

  // File Manager States
  const fileMoveState = useState("global:file:move:state", () => ({
    moveMode: false as boolean,
    sourceFolderId: null as string | null,
    selectedItems: [] as string[],
    selectedFileIds: [] as string[],
    selectedFolderIds: [] as string[],
  }));

  const selectedFoldersForDelete = useState<string[]>(
    "global:folder:selected:list",
    () => []
  );

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
    await Promise.all([fetchTable(), fetchRoute(), fetchSetting()]);
    // Use useSchema to update schemas
    updateSchemas(tables.value);
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

  // File Manager State Management
  function clearFileManagerState() {
    fileMoveState.value = {
      moveMode: false,
      sourceFolderId: null,
      selectedItems: [],
      selectedFileIds: [],
      selectedFolderIds: [],
    };
    selectedFoldersForDelete.value = [];
  }

  return {
    tables,
    schemas, // Pass through from useSchema for backward compatibility
    routes,
    fetchSchema,
    sidebarVisible,
    routeLoading,
    toggleSidebar,
    setSidebarVisible,
    setRouteLoading,
    // File Manager States
    fileMoveState,
    selectedFoldersForDelete,
    clearFileManagerState,
  };
};
