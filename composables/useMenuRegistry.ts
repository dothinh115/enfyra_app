import type { PermissionCondition } from "./usePermissions";

interface MenuItem {
  id: string;
  label: string;
  route: string;
  icon?: string;
  sidebarId: string;
  permission?: PermissionCondition;
}

export function useMenuRegistry() {
  const menuItems = useState<MenuItem[]>("menu-items", () => []);

  const registerMenuItem = (item: MenuItem) => {
    const existingIndex = menuItems.value.findIndex((m) => m.id === item.id);
    if (existingIndex > -1) {
      // Replace existing item
      menuItems.value[existingIndex] = item;
    } else {
      // Add new item
      menuItems.value.push(item);
    }
  };

  const unregisterMenuItem = (id: string) => {
    const index = menuItems.value.findIndex((m) => m.id === id);
    if (index > -1) {
      menuItems.value.splice(index, 1);
    }
  };

  const getMenuItemsBySidebar = (sidebarId: string) => {
    const items = menuItems.value.filter(
      (item) => item.sidebarId === sidebarId
    );

    return items;
  };

  // Helper function to register a table menu item
  const registerTableMenuItem = (table: any) => {
    registerMenuItem({
      id: `table-${table.id}`,
      label: table.name,
      route: `/collections/${table.name}`,
      icon: table.icon || "lucide:database",
      sidebarId: "collections",
      permission: {
        or: [
          { route: "/table_definition", actions: ["update"] },
          { route: "/table_definition", actions: ["delete"] },
        ],
      },
    });
  };

  // Helper function to register data menu item
  const registerDataMenuItem = (table: any) => {
    registerMenuItem({
      id: `data-${table.id}`,
      label: table.name,
      route: `/data/${table.name}`,
      icon: table.icon || "lucide:list",
      sidebarId: "data",
      permission: {
        or: [{ route: `/${table.name}`, actions: ["read"] }],
      },
    });
  };

  // Clear all table menu items
  const clearTableMenus = () => {
    const existingTableItems = menuItems.value.filter(
      (item) => item.id.startsWith("table-") || item.id.startsWith("data-")
    );
    existingTableItems.forEach((item) => unregisterMenuItem(item.id));
  };

  // Clear and re-register all table menus
  const reregisterTableMenus = (tables: any[]) => {
    clearTableMenus();

    // Re-register all tables
    tables.forEach((table) => {
      registerTableMenuItem(table);

      // Only register data menu for non-system tables
      if (!table.isSystem) {
        registerDataMenuItem(table);
      }
    });
  };

  // Clear plugin menu items
  const clearPluginMenus = () => {
    const existingPluginItems = menuItems.value.filter((item) =>
      item.id.startsWith("plugin-")
    );
    existingPluginItems.forEach((item) => unregisterMenuItem(item.id));
  };

  // Helper function to register plugin menu items
  const registerPluginMenuItems = async () => {
    // Import getPlugins dynamically to avoid circular dependency
    const { getPlugins } = usePluginManager();

    try {
      const plugins = await getPlugins();
      const activePagePlugins = plugins.filter(
        (plugin) =>
          plugin.type === "page" && plugin.active && plugin.registration
      );

      activePagePlugins.forEach((plugin) => {
        const menuConfig = (plugin.registration as any)?.menuItem;
        if (menuConfig) {
          registerMenuItem({
            id: `plugin-${plugin.id}`,
            label: menuConfig.label,
            route: menuConfig.route,
            icon: menuConfig.icon || "heroicons:puzzle-piece",
            sidebarId: menuConfig.sidebarId,
            permission: menuConfig.permission,
          });
        }
      });
    } catch (error) {
      console.error("Failed to register plugin menu items:", error);
    }
  };

  // Clear and re-register all plugin menus
  const reregisterPluginMenus = async () => {
    clearPluginMenus();
    await registerPluginMenuItems();
  };

  return {
    menuItems,
    registerMenuItem,
    unregisterMenuItem,
    getMenuItemsBySidebar,
    registerTableMenuItem,
    registerDataMenuItem,
    clearTableMenus,
    reregisterTableMenus,
    clearPluginMenus,
    registerPluginMenuItems,
    reregisterPluginMenus,
  };
}
