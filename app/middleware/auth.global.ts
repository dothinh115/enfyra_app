export default defineNuxtRouteMiddleware(async (to, from) => {
  const { me, fetchUser } = useEnfyraAuth();

  if (!me.value) {
    await fetchUser();
  }

  // If no user yet → call fetchUser
  if (to.path !== "/login") {
    if (!me.value) {
      return navigateTo("/login");
    }
  }

  if (to.path === "/login" && me.value) {
    return navigateTo("/");
  }
});
