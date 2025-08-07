# Permission System Documentation

## Overview

The Enfyra CMS permission system is a comprehensive role-based access control (RBAC) system that provides fine-grained control over user access to different parts of the application. The system is built around the concept of roles, routes, and permissions, allowing administrators to define what users can see and do within the CMS.

## Core Concepts

### 1. Users

- Users are the individuals who access the CMS
- Each user is assigned a role that determines their permissions
- Users can be root administrators (have all permissions) or regular users with specific role-based permissions

### 2. Roles

- Roles are collections of permissions that can be assigned to users
- Each role has a name, description, and a set of route permissions
- Roles can be created, updated, and deleted by administrators

### 3. Routes

- Routes represent API endpoints or pages in the application
- Each route has a path (e.g., `/users`, `/posts`) and associated HTTP methods
- Routes can be enabled or disabled

### 4. Route Permissions

- Route permissions define what actions a role can perform on a specific route
- Each route permission is associated with a route and has a set of allowed methods
- Methods correspond to HTTP verbs: GET (read), POST (create), PATCH (update), DELETE (delete)

### 5. Permission Conditions

- Permission conditions allow for complex permission logic using AND/OR operators
- Conditions can be nested to create sophisticated permission rules
- This enables flexible permission checking for different scenarios

## System Architecture

### Data Structure

```typescript
// User structure
interface User {
  id: string;
  email: string;
  role: Role;
  isRootAdmin: boolean;
}

// Role structure
interface Role {
  id: string;
  name: string;
  description?: string;
  routePermissions: RoutePermission[];
}

// Route permission structure
interface RoutePermission {
  id: string;
  route: Route;
  methods: Method[];
  isEnabled: boolean;
}

// Route structure
interface Route {
  id: string;
  path: string;
  mainTable?: Table;
  isEnabled: boolean;
  isSystem: boolean;
}

// Method structure
interface Method {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
}
```

### Permission Types

The system supports four main permission types:

1. **Read (GET)** - Ability to view data
2. **Create (POST)** - Ability to create new records
3. **Update (PATCH)** - Ability to modify existing records
4. **Delete (DELETE)** - Ability to remove records

## Implementation

### 1. Authentication Flow

The authentication system works as follows:

1. **Login**: Users authenticate with email and password
2. **Token Management**: Access and refresh tokens are managed via cookies
3. **User Profile**: User data including role and permissions are fetched on login
4. **Permission Checking**: Permissions are checked on each request and UI interaction

### 2. Permission Checking

#### usePermissions Composable

The `usePermissions` composable provides the core permission checking functionality:

```typescript
export function usePermissions() {
  const { me } = useAuth();

  // Check if user has permission for a specific route and method
  const hasPermission = (routePath: string, method: string): boolean => {
    if (!me.value) return false;

    // Root admin has all permissions
    if (me.value.isRootAdmin) return true;

    // Check route permissions
    if (!me.value.role?.routePermissions) return false;

    const normalizedRoutePath = routePath.startsWith("/")
      ? routePath
      : `/${routePath}`;

    const routePermission = me.value.role.routePermissions.find(
      (permission: any) =>
        permission.route?.path === normalizedRoutePath && permission.isEnabled
    );

    if (!routePermission) return false;

    return routePermission.methods.some(
      (methodObj: any) => methodObj.method === method
    );
  };

  // Check permission condition (AND/OR logic)
  const checkPermissionCondition = (
    condition: PermissionCondition
  ): boolean => {
    if (condition.and) {
      return condition.and.every((item) => {
        if ("route" in item) {
          return checkPermissionRule(item as PermissionRule);
        } else {
          return checkPermissionCondition(item as PermissionCondition);
        }
      });
    }

    if (condition.or) {
      return condition.or.some((item) => {
        if ("route" in item) {
          return checkPermissionRule(item as PermissionRule);
        } else {
          return checkPermissionCondition(item as PermissionCondition);
        }
      });
    }

    return false;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermissionCondition,
  };
}
```

#### PermissionGate Component

The `PermissionGate` component provides a declarative way to conditionally render content based on permissions:

```vue
<template>
  <div v-if="hasPermission" class="w-full">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Legacy props for backward compatibility
  actions?: ("read" | "create" | "update" | "delete")[];
  routes?: string[];
  mode?: "any" | "all";

  // New flexible permission condition
  condition?: PermissionCondition;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "any",
});

const { hasAnyPermission, hasAllPermissions, checkPermissionCondition } =
  usePermissions();

const hasPermission = computed(() => {
  // Use new condition-based approach if provided
  if (props.condition) {
    return checkPermissionCondition(props.condition);
  }

  // Fallback to legacy approach
  if (props.routes && props.actions) {
    if (props.mode === "all") {
      return hasAllPermissions(props.routes, props.actions);
    } else {
      return hasAnyPermission(props.routes, props.actions);
    }
  }

  return false;
});
</script>
```

### 3. Menu System Integration

The permission system is integrated with the menu system to show/hide menu items based on user permissions:

```typescript
// Menu item registration with permissions
registerMenuItem({
  id: "roles",
  label: "Roles",
  route: "/settings/roles",
  sidebarId: "settings",
  permission: { or: [{ route: "/role_definition", actions: ["read"] }] },
  order: 5,
});

// Menu filtering based on permissions
const visibleMenuItems = computed(() => {
  if (!currentSidebar.value) return [];

  const items = getMenuItemsBySidebar(currentSidebar.value);
  return items.filter((item) => {
    if (!item.permission) return true;
    return checkPermissionCondition(item.permission);
  });
});
```

## Usage Examples

### 1. Basic Permission Checking

```vue
<template>
  <!-- Check if user can read users -->
  <PermissionGate :condition="{ or: [{ route: '/users', actions: ['read'] }] }">
    <div>User list content</div>
  </PermissionGate>

  <!-- Check if user can create and update users -->
  <PermissionGate
    :condition="{
      and: [
        { route: '/users', actions: ['create'] },
        { route: '/users', actions: ['update'] },
      ],
    }"
  >
    <div>User management content</div>
  </PermissionGate>
</template>
```

### 2. Complex Permission Conditions

```vue
<template>
  <!-- User can either read posts OR is a root admin -->
  <PermissionGate
    :condition="{
      or: [
        { route: '/posts', actions: ['read'] },
        { route: '/admin', actions: ['read'] },
      ],
    }"
  >
    <div>Posts content</div>
  </PermissionGate>

  <!-- User must have both read and write permissions -->
  <PermissionGate
    :condition="{
      and: [
        { route: '/articles', actions: ['read'] },
        { route: '/articles', actions: ['create', 'update'] },
      ],
    }"
  >
    <div>Article management</div>
  </PermissionGate>
</template>
```

### 3. Programmatic Permission Checking

```typescript
<script setup lang="ts">
const { hasPermission, checkPermissionCondition } = usePermissions();

// Check specific permission
const canCreateUsers = computed(() => {
  return hasPermission('/users', 'POST');
});

// Check complex condition
const canManageContent = computed(() => {
  return checkPermissionCondition({
    and: [
      { route: '/posts', actions: ['read', 'create'] },
      { route: '/categories', actions: ['read'] }
    ]
  });
});

// Conditional rendering
const showAdminPanel = computed(() => {
  return checkPermissionCondition({
    or: [
      { route: '/admin', actions: ['read'] },
      { route: '/settings', actions: ['read'] }
    ]
  });
});
</script>
```

### 4. API Integration

```typescript
// API calls with permission checking
const { execute: fetchUsers } = useApiLazy(() => "/users", {
  errorContext: "Fetch Users",
});

// Permission check before API call
async function loadUsers() {
  if (hasPermission("/users", "GET")) {
    await fetchUsers();
  } else {
    toast.add({
      title: "Access Denied",
      description: "You do not have permission to view users",
      color: "error",
    });
  }
}
```

## Configuration

### 1. Role Management

Roles can be managed through the admin interface:

1. **Create Role**: Navigate to Settings > Roles > Create
2. **Edit Role**: Click on an existing role to modify permissions
3. **Delete Role**: Use the delete button (only for non-system roles)

### 2. Route Permissions

Route permissions are configured when creating or editing roles:

1. **Select Routes**: Choose which routes the role can access
2. **Set Methods**: Specify which HTTP methods are allowed (GET, POST, PATCH, DELETE)
3. **Enable/Disable**: Toggle individual route permissions

### 3. User Assignment

Users are assigned roles through the user management interface:

1. **Create User**: Navigate to Settings > Users > Create
2. **Assign Role**: Select the appropriate role for the user
3. **Update Role**: Modify user roles as needed

## Best Practices

### 1. Permission Design

- **Principle of Least Privilege**: Only grant the minimum permissions necessary
- **Role-Based Design**: Design roles around job functions rather than individual permissions
- **Regular Review**: Periodically review and update permissions

### 2. Security Considerations

- **Root Admin**: Limit root admin accounts to essential personnel only
- **System Routes**: Be cautious when modifying permissions for system routes
- **Audit Trail**: Monitor permission changes and user access

### 3. Performance

- **Caching**: Permission checks are cached during the user session
- **Efficient Queries**: Use specific permission conditions rather than broad checks
- **Lazy Loading**: Load permissions only when needed

## Troubleshooting

### Common Issues

1. **Permission Not Working**

   - Check if the user has the correct role assigned
   - Verify that the route permission is enabled
   - Ensure the route path matches exactly

2. **Menu Items Not Showing**

   - Check if the menu item has the correct permission condition
   - Verify that the user has the required permissions
   - Check the browser console for errors

3. **API Access Denied**
   - Verify that the route permission includes the correct HTTP method
   - Check if the route is enabled
   - Ensure the user's role is active

### Debugging

```typescript
// Debug permission checking
const { me } = useAuth();
const { hasPermission } = usePermissions();

// Log user permissions
console.log("User:", me.value);
console.log("User role:", me.value?.role);
console.log("Route permissions:", me.value?.role?.routePermissions);

// Test specific permission
const canReadUsers = hasPermission("/users", "GET");
console.log("Can read users:", canReadUsers);
```

## API Reference

### usePermissions Composable

#### Methods

- `hasPermission(routePath: string, method: string): boolean`

  - Check if user has permission for a specific route and method

- `checkPermissionCondition(condition: PermissionCondition): boolean`

  - Check if user satisfies a complex permission condition

- `hasAnyPermission(routes: string[], actions: string[]): boolean`

  - Check if user has any of the specified permissions (legacy)

- `hasAllPermissions(routes: string[], actions: string[]): boolean`
  - Check if user has all of the specified permissions (legacy)

#### Types

```typescript
type PermissionRule = {
  route: string;
  actions: string[];
};

type PermissionCondition = {
  and?: (PermissionRule | PermissionCondition)[];
  or?: (PermissionRule | PermissionCondition)[];
};
```

### PermissionGate Component

#### Props

- `condition?: PermissionCondition` - Complex permission condition
- `actions?: string[]` - Legacy: array of actions to check
- `routes?: string[]` - Legacy: array of routes to check
- `mode?: "any" | "all"` - Legacy: permission checking mode

#### Usage

```vue
<PermissionGate :condition="{ or: [{ route: '/users', actions: ['read'] }] }">
  <div>Protected content</div>
</PermissionGate>
```

## Conclusion

The Enfyra CMS permission system provides a robust, flexible, and secure way to manage user access throughout the application. By understanding the core concepts, implementation details, and best practices outlined in this documentation, administrators can effectively configure and maintain the permission system to meet their organization's security and access control requirements.

For additional support or questions, please refer to the API documentation or contact the development team.
