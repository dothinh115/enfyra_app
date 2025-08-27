export default defineNuxtPlugin(async () => {
  const { logout } = useAuth();

  const {
    registerAllMenusFromApi,
    registerTableMenusWithSidebarIds,
    registerMiniSidebar,
  } = useMenuRegistry();
  const { tables, fetchSchema } = useGlobalState();
  const { confirm } = useConfirm();

  const { fetchMenuDefinitions } = useMenuApi();

  // Fetch schema and menu definitions in parallel for better performance
  const [, menuResponse] = await Promise.all([
    fetchSchema(),
    fetchMenuDefinitions(),
  ]);

  if (
    menuResponse &&
    "data" in menuResponse &&
    Array.isArray(menuResponse.data) &&
    menuResponse.data.length > 0
  ) {
    await registerAllMenusFromApi(menuResponse.data);
  }

  // Wait for tables to be loaded before registering table menus
  if (tables.value.length === 0) {
    // If tables are empty, wait a bit and try again
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Register all table menus using helper function (LAST - after all sidebars are registered)
  if (tables.value.length > 0) {
    await registerTableMenusWithSidebarIds(tables.value);
  }

  // Register logout button as bottom mini sidebar
  registerMiniSidebar({
    id: "logout",
    label: "Logout",
    icon: "lucide:log-out",
    position: "bottom",
    class: "rotate-180 bg-red-800 hover:bg-red-900",
    onClick: async () => {
      const ok = await confirm({ content: "Are you sure you want to logout?" });
      if (ok) await logout();
    },
  });
});
