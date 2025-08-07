# Menu Registry System

Hệ thống đăng ký menu động cho phép quản lý menu items và mini sidebars một cách linh hoạt thay vì hardcode.

## Tổng quan

Hệ thống này bao gồm 2 tầng:

1. **Mini Sidebar Registry** - Quản lý các sidebar chính (Settings, Collections, Data)
2. **Menu Registry** - Quản lý các menu items trong từng sidebar

## Cấu trúc dữ liệu

### MiniSidebar Interface

```typescript
interface MiniSidebar {
  id: string; // 'settings', 'collections', 'data'
  label: string; // 'Settings', 'Collections', 'Data'
  icon: string; // 'lucide:settings', 'lucide:database', etc.
  route: string; // '/settings', '/collections', '/data'
  permission?: PermissionCondition;
}
```

### MenuItem Interface

```typescript
interface MenuItem {
  id: string; // 'routings', 'users', 'roles'
  label: string; // 'Routings', 'Users', 'Roles'
  route: string; // '/settings/routings', '/settings/users'
  icon?: string; // Optional icon cho menu item
  sidebarId: string; // Reference đến mini sidebar ('settings')
  permission?: PermissionCondition;
}
```

### PermissionCondition Interface

```typescript
interface PermissionCondition {
  and?: (PermissionRule | PermissionCondition)[];
  or?: (PermissionRule | PermissionCondition)[];
}

interface PermissionRule {
  route: string;
  actions: string[]; // ['read', 'create', 'update', 'delete']
}
```

## Composables

### useMiniSidebarRegistry

Quản lý các mini sidebars.

```typescript
const { miniSidebars, registerMiniSidebars, unregisterMiniSidebar } =
  useMiniSidebarRegistry();

// Đăng ký nhiều mini sidebars
registerMiniSidebars([
  {
    id: "settings",
    label: "Settings",
    icon: "lucide:settings",
    route: "/settings",
    permission: {
      or: [
        { route: "/setting_definition", actions: ["read", "update"] },
        { route: "/route_definition", actions: ["read", "update"] },
      ],
    },
  },
  {
    id: "collections",
    label: "Collections",
    icon: "lucide:database",
    route: "/collections",
    permission: {
      or: [
        { route: "/table_definition", actions: ["create", "update", "delete"] },
      ],
    },
  },
]);

// Xóa mini sidebar
unregisterMiniSidebar("settings");
```

### useMenuRegistry

Quản lý các menu items.

```typescript
const {
  menuItems,
  registerMenuItem,
  unregisterMenuItem,
  getMenuItemsBySidebar,
} = useMenuRegistry();

// Đăng ký menu item
registerMenuItem({
  id: "routings",
  label: "Routings",
  route: "/settings/routings",
  sidebarId: "settings",
  permission: {
    or: [{ route: "/route_definition", actions: ["read", "update"] }],
  },
});

// Lấy menu items cho sidebar cụ thể
const settingsItems = getMenuItemsBySidebar("settings");

// Xóa menu item
unregisterMenuItem("routings");
```

## Cách sử dụng

### 1. Đăng ký Mini Sidebars

Mini sidebars được đăng ký trong plugin `plugins/menu-registry.client.ts`:

```typescript
export default defineNuxtPlugin(() => {
  const { registerMiniSidebars } = useMiniSidebarRegistry();

  // Đăng ký các mini sidebars cố định
  registerMiniSidebars([
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
      id: "data",
      label: "Data",
      icon: "lucide:list",
      route: "/data",
    },
  ]);
});
```

### 2. Đăng ký Menu Items

Menu items được đăng ký trong plugin `plugins/menu-registry.client.ts`:

```typescript
export default defineNuxtPlugin(() => {
  const { registerMenuItem } = useMenuRegistry();

  // Đăng ký các menu items cho settings
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
```

### 3. Sử dụng trong Components

#### MiniMenu.vue

```vue
<script setup lang="ts">
const { miniSidebars } = useMiniSidebarRegistry();
const { checkPermissionCondition } = usePermissions();

const items = computed(() => {
  const defaultItems = [
    {
      label: "Dashboard",
      icon: "lucide:layout-dashboard",
      route: "/",
      show: true,
    },
  ];

  // Thêm các mini sidebars đã đăng ký
  const registeredItems = miniSidebars.value
    .filter((sidebar) => {
      if (!sidebar.permission) return true;
      return checkPermissionCondition(sidebar.permission);
    })
    .map((sidebar) => ({
      label: sidebar.label,
      icon: sidebar.icon,
      route: sidebar.route,
      show: true,
    }));

  return [...defaultItems, ...registeredItems];
});
</script>
```

#### Menu.vue

```vue
<script setup lang="ts">
const { getMenuItemsBySidebar } = useMenuRegistry();
const { checkPermissionCondition } = usePermissions();

// Lấy sidebar hiện tại dựa trên route
const currentSidebar = computed(() => {
  const path = route.path;
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/collections")) return "collections";
  if (path.startsWith("/data")) return "data";
  return null;
});

// Lấy menu items hiển thị cho sidebar hiện tại
const visibleMenuItems = computed(() => {
  if (!currentSidebar.value) return [];

  const items = getMenuItemsBySidebar(currentSidebar.value);
  return items.filter((item) => {
    if (!item.permission) return true;
    return checkPermissionCondition(item.permission);
  });
});
</script>

<template>
  <nav v-if="currentSidebar" class="flex flex-col space-y-3">
    <PermissionGate
      v-for="item in visibleMenuItems"
      :key="item.id"
      :condition="item.permission"
    >
      <UButton
        size="lg"
        variant="ghost"
        color="neutral"
        :icon="item.icon"
        :to="item.route"
        class="w-full hover:bg-primary/20"
        :class="
          route.path.startsWith(item.route) &&
          'bg-primary/20 text-white shadow hover:!bg-primary/20'
        "
        @click="handleMenuClick"
      >
        <template #trailing>
          <Icon name="lucide:arrow-right" class="ml-auto" />
        </template>
        {{ item.label }}
      </UButton>
    </PermissionGate>
  </nav>
</template>
```

## Permission System

Hệ thống permission hỗ trợ logic phức tạp với AND/OR:

### Ví dụ đơn giản

```typescript
// Chỉ cần có quyền read cho route
permission: {
  or: [{ route: "/user_definition", actions: ["read"] }],
}
```

### Ví dụ phức tạp

```typescript
// Cần có quyền read VÀ update cho route
permission: {
  or: [{ route: "/setting_definition", actions: ["read", "update"] }],
}
```

### Ví dụ với nhiều routes

```typescript
// Cần có quyền cho ít nhất 1 trong các routes
permission: {
  or: [
    { route: "/setting_definition", actions: ["read", "update"] },
    { route: "/route_definition", actions: ["read", "update"] },
    { route: "/user_definition", actions: ["read"] },
  ],
}
```

### Ví dụ với AND logic

```typescript
// Cần có quyền cho TẤT CẢ các điều kiện
permission: {
  and: [
    { route: "/user_definition", actions: ["read"] },
    { route: "/role_definition", actions: ["read"] },
  ],
}
```

## Thêm Menu Item mới

### Bước 1: Tạo page mới

```vue
<!-- pages/settings/new-feature/index.vue -->
<template>
  <div>
    <h1>New Feature</h1>
    <!-- Your content here -->
  </div>
</template>

<script setup lang="ts">
// Your page logic here
</script>
```

### Bước 2: Đăng ký menu item

Thêm vào `plugins/menu-registry.client.ts`:

```typescript
registerMenuItem({
  id: "new-feature",
  label: "New Feature",
  route: "/settings/new-feature",
  sidebarId: "settings",
  permission: {
    or: [{ route: "/new_feature_definition", actions: ["read"] }],
  },
});
```

### Bước 3: Kiểm tra

- Refresh trang
- Vào Settings
- Kiểm tra xem menu item "New Feature" có hiện không
- Kiểm tra permission có hoạt động không

## Thêm Mini Sidebar mới

### Bước 1: Đăng ký mini sidebar

Thêm vào `plugins/menu-registry.client.ts`:

```typescript
registerMiniSidebars([
  // ... existing sidebars
  {
    id: "new-section",
    label: "New Section",
    icon: "lucide:new-icon",
    route: "/new-section",
    permission: {
      or: [{ route: "/new_section_definition", actions: ["read"] }],
    },
  },
]);
```

### Bước 2: Cập nhật Menu.vue

Thêm logic cho sidebar mới trong `components/sidebar/Menu.vue`:

```typescript
const currentSidebar = computed(() => {
  const path = route.path;
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/collections")) return "collections";
  if (path.startsWith("/data")) return "data";
  if (path.startsWith("/new-section")) return "new-section"; // Thêm dòng này
  return null;
});
```

### Bước 3: Tạo pages cho sidebar mới

Tạo các pages trong thư mục `pages/new-section/`:

```
pages/
  new-section/
    index.vue
    [id].vue
    create.vue
```

## Lưu ý quan trọng

1. **Thứ tự hiển thị** được xác định bởi thứ tự trong mảng khi đăng ký
2. **Permission check** được thực hiện tự động dựa trên user's role và permissions
3. **Menu items** chỉ hiển thị khi user có quyền truy cập
4. **Mini sidebars** cũng có thể có permission để ẩn/hiện toàn bộ section
5. **Icon** cho menu items là optional, nếu không có sẽ không hiển thị icon
6. **Route** phải match với cấu trúc thư mục pages

## Troubleshooting

### Menu item không hiện

1. Kiểm tra xem menu item đã được đăng ký chưa
2. Kiểm tra permission có đúng không
3. Kiểm tra `sidebarId` có match với mini sidebar không
4. Kiểm tra console log để debug

### Permission không hoạt động

1. Kiểm tra user có role và permissions không
2. Kiểm tra route path có đúng format không
3. Kiểm tra actions có đúng không (read, create, update, delete)

### Thứ tự menu không đúng

1. Kiểm tra thứ tự trong mảng khi đăng ký
2. Đảm bảo không có `order` property cũ còn sót lại
