import { computed } from "vue";
import { useApiLazy } from "./useApi";

export interface MenuItem {
  id: number;
  description: string;
  icon: string;
  isEnabled: boolean;
  isSystem: boolean;
  label: string;
  order: number;
  path: string;
  permission: any;
  type: "mini" | "menu";
  parent: number | null;
  sidebar: { id: number } | null;
  children: any[];
  menus: any[];
  extension: any;
  createdAt: string;
  updatedAt: string;
}

export const useMenuApi = () => {
  const {
    data: menuDefinitions,
    pending: menuDefinitionsPending,
    execute: fetchMenuDefinitions,
  } = useApiLazy<{ data: MenuItem[] }>(() => "/menu_definition", {
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
