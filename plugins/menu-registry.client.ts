export default defineNuxtPlugin(() => {
  const { registerMiniSidebars } = useMiniSidebarRegistry();
  const { registerMenuItem } = useMenuRegistry();

  // Register default mini sidebars
  registerMiniSidebars([
    {
      id: "data",
      label: "Data",
      icon: "lucide:list",
      route: "/data",
    },

    {
      id: "collections",
      label: "Collections",
      icon: "lucide:database",
      route: "/collections",
      permission: {
        or: [
          {
            route: "/table_definition",
            actions: ["create", "update", "delete"],
          },
        ],
      },
    },
    {
      id: "settings",
      label: "Settings",
      icon: "lucide:settings",
      route: "/settings",
      permission: {
        or: [
          { route: "/setting_definition", actions: ["read", "update"] },
          { route: "/route_definition", actions: ["read", "update"] },
          { route: "/route_handler_definition", actions: ["read"] },
          { route: "/hook_definition", actions: ["read"] },
          { route: "/user_definition", actions: ["read"] },
          { route: "/role_definition", actions: ["read"] },
        ],
      },
    },
  ]);

  // Register default menu items
  registerMenuItem({
    id: "general",
    label: "General",
    route: "/settings/general",
    sidebarId: "settings",
    permission: {
      or: [{ route: "/setting_definition", actions: ["read", "update"] }],
    },
  });

  registerMenuItem({
    id: "routings",
    label: "Routings",
    route: "/settings/routings",
    sidebarId: "settings",
    permission: {
      or: [{ route: "/route_definition", actions: ["read", "update"] }],
    },
  });

  registerMenuItem({
    id: "handlers",
    label: "Handlers",
    route: "/settings/handlers",
    sidebarId: "settings",
    permission: {
      or: [{ route: "/route_handler_definition", actions: ["read"] }],
    },
  });

  registerMenuItem({
    id: "hooks",
    label: "Hooks",
    route: "/settings/hooks",
    sidebarId: "settings",
    permission: {
      or: [{ route: "/hook_definition", actions: ["read"] }],
    },
  });

  registerMenuItem({
    id: "users",
    label: "Users",
    route: "/settings/users",
    sidebarId: "settings",
    permission: {
      or: [{ route: "/user_definition", actions: ["read"] }],
    },
  });

  registerMenuItem({
    id: "roles",
    label: "Roles",
    route: "/settings/roles",
    sidebarId: "settings",
    permission: {
      or: [{ route: "/role_definition", actions: ["read"] }],
    },
  });
});
