export function useAuth() {
  const me = useState<any | null>("global:me", () => null);

  // API composable for fetching user profile
  const {
    data: userData,
    execute: executeFetchUser,
    error: fetchUserError,
  } = useApiLazy(() => "/me", {
    query: {
      fields:
        "*,role.*,role.routePermissions.*,role.routePermissions.methods.*,role.routePermissions.route.*",
    },
    errorContext: "Fetch User Profile",
  });

  // API composable for login
  const { execute: executeLogin, error: loginError } = useApiLazy(
    () => "/login",
    {
      method: "post",
      errorContext: "Login",
    }
  );

  // API composable for logout
  const { execute: executeLogout, error: logoutError } = useApiLazy(
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
