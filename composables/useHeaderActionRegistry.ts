import type { PermissionCondition } from "./usePermissions";
import type { ComputedRef, Ref } from "vue";

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
  disabled?:
    | boolean
    | Ref<boolean>
    | Readonly<Ref<boolean>>
    | ComputedRef<boolean>;
  permission?: PermissionCondition;
  onClick?: () => void;
  to?: string;
  submit?: () => void;
  showOn?: string[];
  hideOn?: string[];
  class?: string;
}

export function useHeaderActionRegistry(
  actions?: HeaderAction | HeaderAction[]
) {
  const headerActions = useState<HeaderAction[]>("header-actions", () => []);
  const route = useRoute();
  const routeActions = useState<Map<string, HeaderAction[]>>(
    "route-actions",
    () => new Map()
  );

  const registerHeaderAction = (action: HeaderAction) => {
    const existingIndex = headerActions.value.findIndex(
      (a) => a.id === action.id
    );
    if (existingIndex > -1) {
      // Update existing action
      headerActions.value[existingIndex] = action;
    } else {
      // Add new action
      headerActions.value.push(action);
    }
  };

  const registerHeaderActions = (actions: HeaderAction[]) => {
    actions.forEach(registerHeaderAction);
  };

  const unregisterHeaderAction = (id: string) => {
    const index = headerActions.value.findIndex((a) => a.id === id);
    if (index > -1) {
      headerActions.value.splice(index, 1);
    }
  };

  const unregisterHeaderActions = (ids: string[]) => {
    ids.forEach(unregisterHeaderAction);
  };

  const clearHeaderActions = () => {
    headerActions.value = [];
  };

  const getHeaderActions = () => {
    return headerActions.value;
  };

  // Register single action for current route
  const register = (action: HeaderAction) => {
    const currentRoute = route.path;
    const existingActions = routeActions.value.get(currentRoute) || [];

    // Add or update action in route actions
    const existingIndex = existingActions.findIndex((a) => a.id === action.id);
    if (existingIndex > -1) {
      existingActions[existingIndex] = action;
    } else {
      existingActions.push(action);
    }

    routeActions.value.set(currentRoute, existingActions);
    registerHeaderAction(action);
  };

  // Register multiple actions for current route
  const registerMultiple = (actions: HeaderAction[]) => {
    const currentRoute = route.path;
    const existingActions = routeActions.value.get(currentRoute) || [];

    // Merge new actions with existing ones
    actions.forEach((action) => {
      const existingIndex = existingActions.findIndex(
        (a) => a.id === action.id
      );
      if (existingIndex > -1) {
        existingActions[existingIndex] = action;
      } else {
        existingActions.push(action);
      }
    });

    routeActions.value.set(currentRoute, existingActions);
    registerHeaderActions(actions);
  };

  // If actions are provided, register them immediately
  if (actions) {
    const actionsArray = Array.isArray(actions) ? actions : [actions];
    registerMultiple(actionsArray);
  }

  // Clear actions when route changes and re-register for new route
  watch(
    () => route.path,
    (newPath, oldPath) => {
      clearHeaderActions();

      // Re-register all actions for new route if exist
      const routeActionsForPath = routeActions.value.get(newPath);
      if (routeActionsForPath && routeActionsForPath.length > 0) {
        registerHeaderActions(routeActionsForPath);
      }
    },
    { immediate: true }
  );

  return {
    headerActions,
    register,
  };
}
