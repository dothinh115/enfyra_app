// useEnfyraApi is auto-imported in Nuxt

export const useMenuApi = () => {
  const {
    data: menuDefinitions,
    pending: menuDefinitionsPending,
    execute: fetchMenuDefinitions,
  } = useEnfyraApi<{ data: MenuApiItem[] }>(() => "/menu_definition", {
    query: computed(() => ({
      limit: 0,
      fields: "*,parent.*,children.*,sidebar.*",
    })),
    errorContext: "Fetch Menu Definitions",
  });

  const getMiniSidebars = computed(() => {
    const miniSidebars = menuDefinitions.value?.data || [];
    return miniSidebars
      .filter((menu) => menu.type === "Mini Sidebar" && menu.isEnabled)
      .sort((a, b) => a.order - b.order);
  });

  const getDropdownMenus = computed(() => {
    const dropdownMenus = menuDefinitions.value?.data || [];
    return dropdownMenus
      .filter((menu) => menu.type === "Dropdown Menu" && menu.isEnabled)
      .sort((a, b) => a.order - b.order);
  });

  const getMenus = computed(() => {
    const menus = menuDefinitions.value?.data || [];
    return menus
      .filter((menu) => menu.type === "Menu" && menu.isEnabled)
      .sort((a, b) => a.order - b.order);
  });

  const getMenuItemsBySidebar = computed(() => {
    return (sidebarId: string) => {
      // Get both regular menus and dropdown menus for the sidebar
      const allMenus = menuDefinitions.value?.data || [];
      const sidebarMenus = allMenus
        .filter(
          (item) =>
            (item.type === "Menu" || item.type === "Dropdown Menu") &&
            item.isEnabled &&
            item.sidebar?.id?.toString() === sidebarId
        )
        .sort((a, b) => a.order - b.order);
      return sidebarMenus;
    };
  });

  return {
    fetchMenuDefinitions,
    menuDefinitionsPending,
    menuDefinitions,
    getMiniSidebars,
    getDropdownMenus,
    getMenus,
    getMenuItemsBySidebar,
  };
};
