import { useMenuRegistry } from "~/composables/useMenuRegistry";
import { useMenuApi } from "~/composables/useMenuApi";
import { useGlobalState } from "~/composables/useGlobalState";
import { useAuth } from "~/composables/useAuth";

export default defineNuxtPlugin(async () => {
  const { me, fetchUser } = useAuth();

  if (!me.value) {
    await fetchUser();
  }
  if (!me.value) {
    return;
  }

  const { registerAllMenusFromApi, registerMiniSidebars, registerMenuItem } =
    useMenuRegistry();
  const { tables, fetchSchema } = useGlobalState();

  const { fetchMenuDefinitions } = useMenuApi();

  await fetchSchema();

  // Fetch and register all menu definitions from API using unified function
  const menuResponse = await fetchMenuDefinitions();
  if (
    menuResponse &&
    "data" in menuResponse &&
    Array.isArray(menuResponse.data) &&
    menuResponse.data.length > 0
  ) {
    await registerAllMenusFromApi(menuResponse.data);
  }

  // Wait for tables to be loaded before registering table menus
  if (tables.value.length === 0) {
    // If tables are empty, wait a bit and try again
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Register all table menus using helper function (LAST - after all sidebars are registered)
  if (tables.value.length > 0) {
    const { registerTableMenusWithSidebarIds } = useMenuRegistry();
    await registerTableMenusWithSidebarIds(tables.value);
  }
});
