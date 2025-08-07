import type { PermissionCondition } from "./usePermissions";

interface MiniSidebar {
  id: string;
  label: string;
  icon: string;
  route: string;
  permission?: PermissionCondition;
}

export function useMiniSidebarRegistry() {
  const miniSidebars = useState<MiniSidebar[]>("mini-sidebars", () => []);

  const registerMiniSidebars = (sidebars: MiniSidebar[]) => {
    sidebars.forEach((sidebar) => {
      const existing = miniSidebars.value.find((s) => s.id === sidebar.id);
      if (!existing) {
        miniSidebars.value.push(sidebar);
      }
    });
  };

  const unregisterMiniSidebar = (id: string) => {
    const index = miniSidebars.value.findIndex((s) => s.id === id);
    if (index > -1) {
      miniSidebars.value.splice(index, 1);
    }
  };

  return { miniSidebars, registerMiniSidebars, unregisterMiniSidebar };
}
