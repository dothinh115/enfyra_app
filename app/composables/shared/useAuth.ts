// useEnfyraApi is now auto-imported

export function useAuth() {
  const me = useState<any | null>("global:me", () => null);

  // Define fields for user profile query - optimized to fetch only necessary fields
  const userProfileFields = [
    // User basic fields
    "id",
    "email",
    "isRootAdmin",
    "isSystem",
    
    // Role and its permissions (for role-based access)
    "role.id",
    "role.name",
    "role.routePermissions.id",
    "role.routePermissions.isEnabled",
    "role.routePermissions.allowedUsers",
    "role.routePermissions.methods.id",
    "role.routePermissions.methods.method",
    "role.routePermissions.route.id",
    "role.routePermissions.route.path",
    
    // Direct user permissions (bypasses role)
    "allowedRoutePermissions.id",
    "allowedRoutePermissions.isEnabled",
    "allowedRoutePermissions.allowedUsers.id",
    "allowedRoutePermissions.methods.id",
    "allowedRoutePermissions.methods.method",
    "allowedRoutePermissions.route.id",
    "allowedRoutePermissions.route.path",
  ];

  // API composable for fetching user profile
  const {
    data: userData,
    execute: executeFetchUser,
    error: fetchUserError,
  } = useEnfyraApi(() => "/me", {
    query: {
      fields: userProfileFields.join(","),
    },
    errorContext: "Fetch User Profile",
  });

  // API composable for login
  const { execute: executeLogin, error: loginError } = useEnfyraApi(
    () => "/login",
    {
      method: "post",
      errorContext: "Login",
    }
  );

  // API composable for logout
  const { execute: executeLogout, error: logoutError } = useEnfyraApi(
    () => "/logout",
    {
      method: "post",
      errorContext: "Logout",
    }
  );

  const fetchUser = async () => {
    await executeFetchUser();

    if (fetchUserError.value) {
      me.value = null;
      return;
    }

    me.value = (userData.value as any)?.data?.[0] || null;
  };

  const login = async (payload: {
    email: string;
    password: string;
    remember?: boolean;
  }) => {
    const response = await executeLogin({ body: payload });

    if (loginError.value) {
      return null;
    }

    await fetchUser();
    return response;
  };

  const logout = async () => {
    await executeLogout();

    me.value = null;
    window.location.reload();
  };

  return {
    me,
    fetchUser,
    logout,
    login,
  };
}
