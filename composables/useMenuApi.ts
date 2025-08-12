import { computed } from "vue";
import { useApiLazy } from "./useApi";
import type { MenuApiItem } from "~/utils/types";

export const useMenuApi = () => {
  const {
    data: menuDefinitions,
    pending: menuDefinitionsPending,
    execute: fetchMenuDefinitions,
  } = useApiLazy<{ data: MenuApiItem[] }>(() => "/menu_definition", {
    query: computed(() => ({ limit: 0 })),
    errorContext: "Fetch Menu Definitions",
  });

  const getMiniSidebars = computed(() => {
    const menus = menuDefinitions.value?.data || [];
    return menus
      .filter((menu) => menu.type === "mini" && menu.isEnabled)
      .sort((a, b) => a.order - b.order);
  });

  const getMenuItems = computed(() => {
    const menus = menuDefinitions.value?.data || [];
    return menus
      .filter((menu) => menu.type === "menu" && menu.isEnabled)
      .sort((a, b) => a.order - b.order);
  });

  const getMenuItemsBySidebar = computed(() => {
    return (sidebarId: string) => {
      const items = getMenuItems.value;
      return items
        .filter((item) => item.sidebar?.id?.toString() === sidebarId)
        .sort((a, b) => a.order - b.order);
    };
  });

  return {
    fetchMenuDefinitions,
    menuDefinitionsPending,
    getMenuItems,
  };
};
