import type { PermissionRule, PermissionCondition } from "~/utils/types";

export function usePermissions() {
  const { me } = useAuth();

  // Helper function to check if user has permission for a specific route and method
  const hasPermission = (routePath: string, method: string): boolean => {
    if (!me.value) {
      return false;
    }

    // Root admin has all permissions
    if (me.value.isRootAdmin) {
      return true;
    }

    // Check if user has role and route permissions
    if (!me.value.role?.routePermissions) return false;

    // Normalize route path - ensure it starts with /
    const normalizedRoutePath = routePath.startsWith("/")
      ? routePath
      : `/${routePath}`;

    // Find all route permissions that match the route path
    const routePermissions = me.value.role.routePermissions.filter(
      (permission: any) =>
        permission.route?.path === normalizedRoutePath && permission.isEnabled
    );

    if (!routePermissions.length) return false;

    // Check if any permission has the required method
    return routePermissions.some((permission: any) =>
      permission.methods.some((methodObj: any) => methodObj.method === method)
    );
  };

  // Check if user has permission for a single rule
  const checkPermissionRule = (rule: PermissionRule): boolean => {
    return rule.actions.every((action) => {
      switch (action) {
        case "read":
          return hasPermission(rule.route, "GET");
        case "create":
          return hasPermission(rule.route, "POST");
        case "update":
          return hasPermission(rule.route, "PATCH");
        case "delete":
          return hasPermission(rule.route, "DELETE");
        default:
          return false;
      }
    });
  };

  // Check if user has permission for a condition
  const checkPermissionCondition = (
    condition: PermissionCondition
  ): boolean => {
    if (condition.allowAll === true) {
      return true;
    }

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

  // Legacy methods for backward compatibility
  const hasAnyPermission = (routes: string[], actions: string[]): boolean => {
    return routes.some((routePath) => {
      return actions.some((action) => {
        switch (action) {
          case "read":
            return hasPermission(routePath, "GET");
          case "create":
            return hasPermission(routePath, "POST");
          case "update":
            return hasPermission(routePath, "PATCH");
          case "delete":
            return hasPermission(routePath, "DELETE");
          default:
            return false;
        }
      });
    });
  };

  const hasAllPermissions = (routes: string[], actions: string[]): boolean => {
    return routes.every((routePath) => {
      return actions.every((action) => {
        switch (action) {
          case "read":
            return hasPermission(routePath, "GET");
          case "create":
            return hasPermission(routePath, "POST");
          case "update":
            return hasPermission(routePath, "PATCH");
          case "delete":
            return hasPermission(routePath, "DELETE");
          default:
            return false;
        }
      });
    });
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermissionCondition,
  };
}
