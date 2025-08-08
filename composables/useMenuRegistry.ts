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
      console.log("Replaced menu item:", item.id, item.sidebarId); // Debug log
    } else {
      // Add new item
      menuItems.value.push(item);
      console.log("Added menu item:", item.id, item.sidebarId); // Debug log
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
