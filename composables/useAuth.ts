import { useApiWithError } from "./useApiWithError";

export function useAuth() {
  const me = useState<any | null>("global:me", () => null);

  const fetchUser = async () => {
    try {
      const { data } = await useApiWithError("/me", {
        method: "get",
        errorContext: "Fetch User",
      });
      me.value = data.value.data[0];
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
      const { data } = await useApiWithError("/login", {
        method: "post",
        body: payload,
        errorContext: "Login",
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
      await useApiWithError("/logout", {
        method: "post",
        errorContext: "Logout",
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
