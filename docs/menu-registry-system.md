# Menu Registry System

The Menu Registry System provides a dynamic, plugin-ready architecture for managing navigation menus in Enfyra CMS. This system allows plugins and modules to register their own menu items and sidebars without modifying core code.

## Overview

The Menu Registry System consists of two layers:

1. **Mini Sidebar Registry** - Manages main sidebar sections (Settings, Collections, Data)
2. **Menu Item Registry** - Manages individual menu items within each sidebar

This two-tier architecture enables complete customization of the navigation structure while maintaining consistency and permission controls.

## Architecture

### System Components

```
┌─────────────────────┐
│   Mini Sidebars     │  ← Main sidebar sections
├─────────────────────┤
│   ├── Settings      │
│   ├── Collections   │
│   └── Data          │
└─────────────────────┘
         ↓
┌─────────────────────┐
│    Menu Items       │  ← Items within each sidebar
├─────────────────────┤
│   Settings:         │
│   ├── General       │
│   ├── Users         │
│   └── Roles         │
└─────────────────────┘
```

### Data Flow

1. Plugins register sidebars and menu items during initialization
2. Components retrieve registered items via composables
3. Permission system filters items based on user roles
4. UI components render filtered navigation

## Data Structures

### MiniSidebar Interface

```typescript
interface MiniSidebar {
  id: string;                      // Unique identifier ('settings', 'data', etc.)
  label: string;                   // Display name
  icon: string;                    // Icon identifier (e.g., 'lucide:settings')
  route: string;                   // Base route path
  permission?: PermissionCondition; // Optional permission requirements
}
```

### MenuItem Interface

```typescript
interface MenuItem {
  id: string;                      // Unique identifier
  label: string;                   // Display name
  route: string;                   // Full route path
  icon?: string;                   // Optional icon
  sidebarId: string;              // Parent sidebar ID
  permission?: PermissionCondition; // Optional permission requirements
}
```

### PermissionCondition Interface

```typescript
interface PermissionCondition {
  and?: (PermissionRule | PermissionCondition)[];
  or?: (PermissionRule | PermissionCondition)[];
}

interface PermissionRule {
  route: string;                   // API route to check
  actions: string[];              // Required actions ('read', 'create', 'update', 'delete')
}
```

## Composables

### useMiniSidebarRegistry

Manages mini sidebar registration and retrieval.

```typescript
const {
  miniSidebars,              // Reactive array of registered sidebars
  registerMiniSidebars,       // Register multiple sidebars
  unregisterMiniSidebar      // Remove a sidebar
} = useMiniSidebarRegistry();
```

### useMenuRegistry

Manages menu item registration and retrieval.

```typescript
const {
  menuItems,                 // Reactive array of all menu items
  registerMenuItem,          // Register a single menu item
  unregisterMenuItem,        // Remove a menu item
  getMenuItemsBySidebar     // Get items for specific sidebar
} = useMenuRegistry();
```

## Basic Usage

### Registering Mini Sidebars

Register sidebars in a plugin during initialization:

```typescript
// plugins/menu-registry.client.ts
export default defineNuxtPlugin(() => {
  const { registerMiniSidebars } = useMiniSidebarRegistry();

  registerMiniSidebars([
    {
      id: "settings",
      label: "Settings",
      icon: "lucide:settings",
      route: "/settings",
      permission: {
        or: [
          { route: "/setting_definition", actions: ["read"] },
          { route: "/user_definition", actions: ["read"] },
          { route: "/role_definition", actions: ["read"] }
        ]
      }
    },
    {
      id: "data",
      label: "Data",
      icon: "lucide:database",
      route: "/data"
    }
  ]);
});
```

### Registering Menu Items

Register individual menu items for each sidebar:

```typescript
// plugins/menu-registry.client.ts
export default defineNuxtPlugin(() => {
  const { registerMenuItem } = useMenuRegistry();

  // Register settings menu items
  registerMenuItem({
    id: "users",
    label: "Users",
    route: "/settings/users",
    sidebarId: "settings",
    permission: {
      or: [{ route: "/user_definition", actions: ["read"] }]
    }
  });

  registerMenuItem({
    id: "roles",
    label: "Roles",
    route: "/settings/roles",
    sidebarId: "settings",
    permission: {
      or: [{ route: "/role_definition", actions: ["read"] }]
    }
  });
});
```

### Using in Components

#### Display Mini Sidebars

```vue
<!-- components/MiniMenu.vue -->
<template>
  <nav class="mini-sidebar">
    <div v-for="sidebar in visibleSidebars" :key="sidebar.id">
      <UButton
        :label="sidebar.label"
        :icon="sidebar.icon"
        :to="sidebar.route"
        variant="ghost"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
const { miniSidebars } = useMiniSidebarRegistry();
const { checkPermissionCondition } = usePermissions();

const visibleSidebars = computed(() => {
  return miniSidebars.value.filter(sidebar => {
    if (!sidebar.permission) return true;
    return checkPermissionCondition(sidebar.permission);
  });
});
</script>
```

#### Display Menu Items

```vue
<!-- components/Menu.vue -->
<template>
  <nav class="menu">
    <PermissionGate
      v-for="item in visibleMenuItems"
      :key="item.id"
      :condition="item.permission"
    >
      <UButton
        :label="item.label"
        :icon="item.icon"
        :to="item.route"
        variant="ghost"
        :class="{ active: isActive(item.route) }"
      />
    </PermissionGate>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();
const { getMenuItemsBySidebar } = useMenuRegistry();
const { checkPermissionCondition } = usePermissions();

// Determine current sidebar from route
const currentSidebar = computed(() => {
  const path = route.path;
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/collections")) return "collections";
  if (path.startsWith("/data")) return "data";
  return null;
});

// Get filtered menu items for current sidebar
const visibleMenuItems = computed(() => {
  if (!currentSidebar.value) return [];
  
  const items = getMenuItemsBySidebar(currentSidebar.value);
  return items.filter(item => {
    if (!item.permission) return true;
    return checkPermissionCondition(item.permission);
  });
});

const isActive = (itemRoute: string) => {
  return route.path.startsWith(itemRoute);
};
</script>
```

## Advanced Usage

### Dynamic Menu Registration

Register menu items based on data or user context:

```typescript
// Register menu items for dynamic tables
const { data: tables } = await useApi("/table_definition");

tables.value?.forEach(table => {
  registerMenuItem({
    id: `data-${table.name}`,
    label: table.label || table.name,
    route: `/data/${table.name}`,
    sidebarId: "data",
    permission: {
      or: [{ route: `/${table.name}`, actions: ["read"] }]
    }
  });
});
```

### Plugin-Based Menu Extension

Create a plugin that adds new functionality with its own navigation:

```typescript
// plugins/ecommerce.client.ts
export default defineNuxtPlugin(() => {
  const { registerMiniSidebars } = useMiniSidebarRegistry();
  const { registerMenuItem } = useMenuRegistry();

  // Add e-commerce sidebar
  registerMiniSidebars([{
    id: "ecommerce",
    label: "E-Commerce",
    icon: "lucide:shopping-cart",
    route: "/ecommerce",
    permission: {
      or: [{ route: "/products", actions: ["read"] }]
    }
  }]);

  // Add e-commerce menu items
  const ecommerceItems = [
    { id: "products", label: "Products", route: "/ecommerce/products" },
    { id: "orders", label: "Orders", route: "/ecommerce/orders" },
    { id: "customers", label: "Customers", route: "/ecommerce/customers" },
    { id: "analytics", label: "Analytics", route: "/ecommerce/analytics" }
  ];

  ecommerceItems.forEach(item => {
    registerMenuItem({
      ...item,
      sidebarId: "ecommerce",
      permission: {
        or: [{ route: `/${item.id}`, actions: ["read"] }]
      }
    });
  });
});
```

### Conditional Menu Items

Show/hide menu items based on application state:

```typescript
// Show different menu items based on feature flags
const { featureFlags } = useFeatureFlags();

if (featureFlags.value.betaFeatures) {
  registerMenuItem({
    id: "beta-features",
    label: "Beta Features",
    route: "/settings/beta",
    sidebarId: "settings",
    icon: "lucide:flask"
  });
}

// Show menu items based on user subscription
const { subscription } = useUserSubscription();

if (subscription.value?.tier === 'premium') {
  registerMenuItem({
    id: "premium-analytics",
    label: "Advanced Analytics",
    route: "/analytics/premium",
    sidebarId: "data",
    icon: "lucide:trending-up"
  });
}
```

## Permission System Integration

### Simple Permission Check

```typescript
// Menu item visible only to users with read permission
registerMenuItem({
  id: "users",
  label: "Users",
  route: "/settings/users",
  sidebarId: "settings",
  permission: {
    or: [{ route: "/user_definition", actions: ["read"] }]
  }
});
```

### Complex Permission Logic

```typescript
// Require multiple permissions with AND/OR logic
registerMenuItem({
  id: "admin-panel",
  label: "Admin Panel",
  route: "/admin",
  sidebarId: "settings",
  permission: {
    and: [
      { route: "/admin", actions: ["read"] },
      {
        or: [
          { route: "/users", actions: ["update", "delete"] },
          { route: "/roles", actions: ["update", "delete"] }
        ]
      }
    ]
  }
});
```

### Permission Inheritance

```typescript
// Sidebar permission affects all child menu items
registerMiniSidebars([{
  id: "admin",
  label: "Administration",
  icon: "lucide:shield",
  route: "/admin",
  permission: {
    or: [{ route: "/admin", actions: ["read"] }]
  }
}]);

// Child items inherit sidebar visibility
registerMenuItem({
  id: "admin-logs",
  label: "System Logs",
  route: "/admin/logs",
  sidebarId: "admin"
  // No permission needed - inherited from sidebar
});
```

## Best Practices

### 1. Unique IDs

Use descriptive, unique IDs following a consistent pattern:

```typescript
// Good
id: "settings-users"
id: "data-products"
id: "ecommerce-orders"

// Bad
id: "item1"
id: "menu"
id: "button"
```

### 2. Consistent Icons

Use a consistent icon library and naming convention:

```typescript
// Lucide icons (recommended)
icon: "lucide:settings"
icon: "lucide:users"
icon: "lucide:database"

// Avoid mixing icon libraries
icon: "mdi:settings"  // Avoid if using Lucide elsewhere
```

### 3. Route Naming

Follow a hierarchical route structure:

```typescript
// Good - hierarchical and predictable
route: "/settings"
route: "/settings/users"
route: "/settings/users/create"

// Bad - inconsistent structure
route: "/config"
route: "/user-management"
route: "/new-user"
```

### 4. Permission Patterns

Define reusable permission patterns:

```typescript
// Create permission helper
const createReadPermission = (route: string) => ({
  or: [{ route, actions: ["read"] }]
});

// Use consistently
registerMenuItem({
  id: "users",
  label: "Users",
  route: "/settings/users",
  sidebarId: "settings",
  permission: createReadPermission("/user_definition")
});
```

### 5. Initialization Order

Register items in the correct order:

```typescript
export default defineNuxtPlugin(() => {
  // 1. Register sidebars first
  registerMiniSidebars([...]);
  
  // 2. Then register menu items
  registerMenuItem({...});
  
  // 3. Finally, handle dynamic items
  fetchDynamicMenus().then(items => {
    items.forEach(item => registerMenuItem(item));
  });
});
```

## Plugin Development Guide

### Creating a Menu Plugin

```typescript
// plugins/custom-module.client.ts
export default defineNuxtPlugin(() => {
  const { registerMiniSidebars } = useMiniSidebarRegistry();
  const { registerMenuItem } = useMenuRegistry();
  
  // Define your module's sidebar
  const moduleSidebar = {
    id: "my-module",
    label: "My Module",
    icon: "lucide:package",
    route: "/my-module",
    permission: {
      or: [{ route: "/my_module", actions: ["read"] }]
    }
  };
  
  // Define menu items
  const moduleItems = [
    {
      id: "my-module-dashboard",
      label: "Dashboard",
      route: "/my-module/dashboard",
      icon: "lucide:layout-dashboard"
    },
    {
      id: "my-module-settings",
      label: "Settings",
      route: "/my-module/settings",
      icon: "lucide:settings"
    }
  ];
  
  // Register sidebar
  registerMiniSidebars([moduleSidebar]);
  
  // Register menu items
  moduleItems.forEach(item => {
    registerMenuItem({
      ...item,
      sidebarId: "my-module"
    });
  });
});
```

### Extending Existing Menus

Add items to existing sidebars:

```typescript
// plugins/extend-settings.client.ts
export default defineNuxtPlugin(() => {
  const { registerMenuItem } = useMenuRegistry();
  
  // Add custom settings page
  registerMenuItem({
    id: "custom-settings",
    label: "Custom Settings",
    route: "/settings/custom",
    sidebarId: "settings",  // Add to existing settings sidebar
    permission: {
      or: [{ route: "/custom_settings", actions: ["read"] }]
    }
  });
});
```

## Troubleshooting

### Menu Items Not Appearing

1. **Check Registration Order**
   - Ensure sidebars are registered before menu items
   - Verify plugin execution order

2. **Verify Permissions**
   - Check user has required permissions
   - Test with root admin account
   - Check browser console for permission errors

3. **Validate IDs**
   - Ensure unique IDs for all items
   - Check sidebarId matches registered sidebar

4. **Route Conflicts**
   - Verify routes don't conflict with existing pages
   - Check route patterns match page structure

### Dynamic Menus Not Updating

```typescript
// Use reactive references for dynamic menus
const dynamicItems = ref<MenuItem[]>([]);

watch(dynamicItems, (items) => {
  // Unregister old items
  items.forEach(item => unregisterMenuItem(item.id));
  
  // Register new items
  items.forEach(item => registerMenuItem(item));
});
```

### Permission Issues

```typescript
// Debug permissions
const { checkPermissionCondition } = usePermissions();
const { me } = useAuth();

console.log('User permissions:', me.value?.role?.routePermissions);
console.log('Menu permission check:', checkPermissionCondition(menuItem.permission));
```

## Migration from Static Menus

### Before (Static Menu)

```vue
<!-- components/Menu.vue -->
<template>
  <nav>
    <NuxtLink to="/settings/users">Users</NuxtLink>
    <NuxtLink to="/settings/roles">Roles</NuxtLink>
    <NuxtLink to="/settings/general">General</NuxtLink>
  </nav>
</template>
```

### After (Dynamic Registry)

```vue
<!-- components/Menu.vue -->
<template>
  <nav>
    <NuxtLink
      v-for="item in menuItems"
      :key="item.id"
      :to="item.route"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<script setup>
const { getMenuItemsBySidebar } = useMenuRegistry();
const menuItems = computed(() => getMenuItemsBySidebar('settings'));
</script>
```

## API Reference

### useMiniSidebarRegistry

#### Methods

- `registerMiniSidebars(sidebars: MiniSidebar[]): void`
  - Register multiple sidebars at once
  
- `unregisterMiniSidebar(id: string): void`
  - Remove a sidebar by ID

#### Properties

- `miniSidebars: Ref<MiniSidebar[]>`
  - Reactive array of registered sidebars

### useMenuRegistry

#### Methods

- `registerMenuItem(item: MenuItem): void`
  - Register a single menu item
  
- `unregisterMenuItem(id: string): void`
  - Remove a menu item by ID
  
- `getMenuItemsBySidebar(sidebarId: string): MenuItem[]`
  - Get all items for a specific sidebar

#### Properties

- `menuItems: Ref<MenuItem[]>`
  - Reactive array of all registered menu items

## Summary

The Menu Registry System provides:

1. **Dynamic Navigation** - Register menus at runtime
2. **Plugin Architecture** - Extend navigation without core changes
3. **Permission Integration** - Built-in access control
4. **Type Safety** - Full TypeScript support
5. **Reactive Updates** - Automatic UI updates
6. **Hierarchical Structure** - Two-tier organization

This system enables Enfyra CMS to support unlimited extensibility through plugins while maintaining a consistent, permission-controlled navigation experience.