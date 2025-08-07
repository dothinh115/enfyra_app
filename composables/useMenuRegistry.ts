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
    const existing = menuItems.value.find((m) => m.id === item.id);
    if (!existing) {
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

  return {
    menuItems,
    registerMenuItem,
    unregisterMenuItem,
    getMenuItemsBySidebar,
  };
}
