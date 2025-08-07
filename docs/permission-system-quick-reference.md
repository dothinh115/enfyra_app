# Permission System Quick Reference

## Quick Start

### 1. Basic Permission Check

```vue
<template>
  <!-- Simple permission check -->
  <PermissionGate :condition="{ or: [{ route: '/users', actions: ['read'] }] }">
    <div>User content</div>
  </PermissionGate>
</template>
```

### 2. Programmatic Permission Check

```typescript
const { hasPermission } = usePermissions();

// Check if user can read users
const canReadUsers = hasPermission("/users", "GET");

// Check if user can create users
const canCreateUsers = hasPermission("/users", "POST");
```

### 3. Complex Permission Conditions

```typescript
// AND condition - user must have both permissions
const condition = {
  and: [
    { route: "/users", actions: ["read"] },
    { route: "/users", actions: ["create"] },
  ],
};

// OR condition - user must have at least one permission
const condition = {
  or: [
    { route: "/users", actions: ["read"] },
    { route: "/admin", actions: ["read"] },
  ],
};
```

## Permission Types

| Action   | HTTP Method | Description             |
| -------- | ----------- | ----------------------- |
| `read`   | GET         | View data               |
| `create` | POST        | Create new records      |
| `update` | PATCH       | Modify existing records |
| `delete` | DELETE      | Remove records          |

## Common Patterns

### 1. Menu Item Registration

```typescript
registerMenuItem({
  id: "users",
  label: "Users",
  route: "/settings/users",
  sidebarId: "settings",
  permission: { or: [{ route: "/user_definition", actions: ["read"] }] },
  order: 1,
});
```

### 2. Conditional Rendering

```vue
<template>
  <!-- Show based on permission -->
  <PermissionGate
    :condition="{ or: [{ route: '/users', actions: ['create'] }] }"
  >
    <UButton @click="createUser">Create User</UButton>
  </PermissionGate>

  <!-- Hide based on permission -->
  <div v-if="!hasPermission('/admin', 'GET')">
    <p>Access denied</p>
  </div>
</template>
```

### 3. API Protection

```typescript
async function deleteUser(userId: string) {
  if (!hasPermission("/users", "DELETE")) {
    toast.add({
      title: "Access Denied",
      description: "You do not have permission to delete users",
      color: "error",
    });
    return;
  }

  await deleteUserAPI(userId);
}
```

## Permission Conditions Reference

### Basic Structure

```typescript
type PermissionCondition = {
  and?: (PermissionRule | PermissionCondition)[];
  or?: (PermissionRule | PermissionCondition)[];
};

type PermissionRule = {
  route: string;
  actions: string[];
};
```

### Examples

```typescript
// Single permission
{ route: '/users', actions: ['read'] }

// Multiple actions
{ route: '/users', actions: ['read', 'create', 'update'] }

// AND condition
{
  and: [
    { route: '/users', actions: ['read'] },
    { route: '/posts', actions: ['read'] }
  ]
}

// OR condition
{
  or: [
    { route: '/users', actions: ['read'] },
    { route: '/admin', actions: ['read'] }
  ]
}

// Nested conditions
{
  and: [
    { route: '/users', actions: ['read'] },
    {
      or: [
        { route: '/posts', actions: ['read'] },
        { route: '/comments', actions: ['read'] }
      ]
    }
  ]
}
```

## Common Routes

| Route       | Description        | Common Actions                       |
| ----------- | ------------------ | ------------------------------------ |
| `/users`    | User management    | `read`, `create`, `update`, `delete` |
| `/roles`    | Role management    | `read`, `create`, `update`, `delete` |
| `/posts`    | Content management | `read`, `create`, `update`, `delete` |
| `/settings` | System settings    | `read`, `update`                     |
| `/admin`    | Admin panel        | `read`                               |

## Debugging

### 1. Check User Permissions

```typescript
const { me } = useAuth();
const { hasPermission } = usePermissions();

// Log current user and permissions
console.log("User:", me.value);
console.log("Role:", me.value?.role);
console.log("Route permissions:", me.value?.role?.routePermissions);

// Test specific permission
console.log("Can read users:", hasPermission("/users", "GET"));
```

### 2. Debug Permission Conditions

```typescript
const { checkPermissionCondition } = usePermissions();

const condition = { or: [{ route: "/users", actions: ["read"] }] };
const hasAccess = checkPermissionCondition(condition);
console.log("Has access:", hasAccess);
```

## Best Practices

### 1. Permission Design

- Use specific routes rather than broad permissions
- Group related permissions into roles
- Follow the principle of least privilege

### 2. Performance

- Cache permission checks when possible
- Use efficient permission conditions
- Avoid unnecessary permission checks

### 3. Security

- Always check permissions on both client and server
- Validate permissions before API calls
- Log permission-related activities

## Troubleshooting

### Common Issues

1. **Permission not working**

   - Check if user has correct role
   - Verify route permission is enabled
   - Ensure route path matches exactly

2. **Menu items not showing**

   - Check permission condition syntax
   - Verify user has required permissions
   - Check browser console for errors

3. **API access denied**
   - Verify HTTP method is allowed
   - Check if route is enabled
   - Ensure user role is active

### Quick Fixes

```typescript
// Force refresh user permissions
const { fetchUser } = useAuth();
await fetchUser();

// Check if user is root admin
if (me.value?.isRootAdmin) {
  // User has all permissions
}

// Debug permission check
const debugPermission = (route: string, method: string) => {
  console.log(`Checking ${method} permission for ${route}`);
  const result = hasPermission(route, method);
  console.log(`Result: ${result}`);
  return result;
};
```
