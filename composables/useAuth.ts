export function useAuth() {
  const me = ref<any>(null);

  const fetchUser = async () => {
    try {
      const { data } = await useApi("/me", {
        method: "get",
      });
      me.value = data.value;
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
      const { data } = await useApi("/login", {
        method: "post",
        body: payload,
      });

      await fetchUser();
      return data.value;
    } catch (err: any) {
      console.log(err.message);
      return null;
    }
  };

  const logout = async () => {
    try {
      await useApi("/logout", {
        method: "post",
      });
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
