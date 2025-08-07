export function useAuth() {
  const me = useState<any | null>("global:me", () => null);

  // API composable for fetching user profile
  const { data: userData, execute: executeFetchUser } = useApiLazy(
    () => "/me",
    {
      query: {
        fields:
          "*,role.*,role.routePermissions.*,role.routePermissions.methods.*,role.routePermissions.route.*",
      },
      errorContext: "Fetch User Profile",
    }
  );

  // API composable for login
  const { execute: executeLogin } = useApiLazy(() => "/login", {
    method: "post",
    errorContext: "Login",
  });

  // API composable for logout
  const { execute: executeLogout } = useApiLazy(() => "/logout", {
    method: "post",
    errorContext: "Logout",
  });

  const fetchUser = async () => {
    try {
      await executeFetchUser();
      me.value = (userData.value as any)?.data?.[0] || null;
    } catch (err: any) {
      me.value = null;
    }
  };

  const login = async (payload: {
    email: string;
    password: string;
    remember?: boolean;
  }) => {
    try {
      console.log("🔥 Login payload:", payload);
      const response = await executeLogin({ body: payload });
      console.log("🔥 Login response:", response);
      await fetchUser();
      return response;
    } catch (err: any) {
      console.error("🔥 Login error:", err);
      return null;
    }
  };

  const logout = async () => {
    try {
      await executeLogout();
      me.value = null;
      window.location.reload();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return {
    me,
    fetchUser,
    logout,
    login,
  };
}
