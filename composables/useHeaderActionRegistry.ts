import type { PermissionCondition } from "./usePermissions";

export interface HeaderAction {
  id: string;
  label?: string;
  icon: string;
  variant?: "solid" | "outline" | "ghost" | "soft";
  color?:
    | "primary"
    | "secondary"
    | "warning"
    | "success"
    | "info"
    | "error"
    | "neutral";
  size?: "sm" | "md" | "lg" | "xl";
  loading?:
    | boolean
    | Ref<boolean>
    | Readonly<Ref<boolean>>
    | ComputedRef<boolean>;
  disabled?: boolean;
  permission?: PermissionCondition;
  onClick?: () => void;
  to?: string;
  submit?: () => void;
  showOn?: string[];
  hideOn?: string[];
  class?: string;
}

export function useHeaderActionRegistry(action?: HeaderAction) {
  const headerActions = useState<HeaderAction[]>("header-actions", () => []);
  const route = useRoute();
  const routeActions = useState<Map<string, HeaderAction>>(
    "route-actions",
    () => new Map()
  );

  const registerHeaderAction = (action: HeaderAction) => {
    const existing = headerActions.value.find((a) => a.id === action.id);
    if (!existing) {
      headerActions.value.push(action);
    }
  };

  const unregisterHeaderAction = (id: string) => {
    const index = headerActions.value.findIndex((a) => a.id === id);
    if (index > -1) {
      headerActions.value.splice(index, 1);
    }
  };

  const clearHeaderActions = () => {
    headerActions.value = [];
  };

  const getHeaderActions = () => {
    return headerActions.value;
  };

  // Register action for current route
  const register = (action: HeaderAction) => {
    const currentRoute = route.path;

    // Store action for this route
    routeActions.value.set(currentRoute, action);

    // Register action immediately
    registerHeaderAction(action);
  };

  // If action is provided, register it immediately
  if (action) {
    const currentRoute = route.path;
    routeActions.value.set(currentRoute, action);
    registerHeaderAction(action);
  }

  // Clear actions when route changes and re-register for new route
  watch(
    () => route.path,
    (newPath, oldPath) => {
      clearHeaderActions();

      // Re-register action for new route if exists
      const action = routeActions.value.get(newPath);
      if (action) {
        registerHeaderAction(action);
      }
    },
    { immediate: true }
  );

  return {
    headerActions,
    register,
  };
}
