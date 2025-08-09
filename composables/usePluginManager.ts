import { useDynamicComponent } from "./useDynamicComponent";

// Simple types
export type PluginType = "page" | "widget";

export interface Plugin {
  id: string;
  description: string;
  type: PluginType;
  url: string;
  active: boolean;
  registration?: {
    miniSidebar?: {
      id: string;
      label: string;
      icon: string;
      route: string;
    };
    menuItem?: {
      label: string;
      icon?: string;
      route: string;
      sidebarId: string;
    };
  };
}

/**
 * Simple Plugin Manager - Fetch plugin registry and load plugins
 */
export const usePluginManager = () => {
  const { loadExternalComponent } = useDynamicComponent();

  // Track loaded plugins
  const loadedPlugins = useState<Map<string, any>>(
    "loaded-plugins",
    () => new Map()
  );
  const pluginComponents = useState<Map<string, any>>(
    "plugin-components",
    () => new Map()
  );

  // API composable for fetching plugins
  const { data: pluginData, execute: executeFetchPlugins } = useApiLazy(
    () => "/plugin/registry",
    {
      errorContext: "Fetch Plugins Registry",
    }
  );

  const getPlugins = async (): Promise<Plugin[]> => {
    await executeFetchPlugins();
    return pluginData.value?.plugins || [];
  };

  /**
   * Load plugin by ID
   * @param pluginId - Plugin ID
   * @param forceReload - Force reload even if cached
   * @returns Loaded component
   */
  const loadPlugin = async (pluginId: string, forceReload: boolean = false) => {
    const plugins = await getPlugins();
    const plugin = plugins.find((p) => p.id === pluginId);

    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // If force reload, clear cache first
    if (forceReload) {
      loadedPlugins.value.delete(pluginId);
      pluginComponents.value.delete(pluginId);
    }

    if (loadedPlugins.value.has(pluginId)) {
      return pluginComponents.value.get(pluginId);
    }

    const component = await loadExternalComponent(plugin.url, pluginId);

    loadedPlugins.value.set(pluginId, plugin);
    pluginComponents.value.set(pluginId, component);

    return component;
  };

  /**
   * Unload plugin
   * @param pluginId - Plugin ID
   */
  const unloadPlugin = (pluginId: string) => {
    const plugin = loadedPlugins.value.get(pluginId);
    if (!plugin) return;

    loadedPlugins.value.delete(pluginId);
    pluginComponents.value.delete(pluginId);
  };

  /**
   * Load all plugins
   */
  const loadAllPlugins = async () => {
    const plugins = await getPlugins();
    const activePlugins = plugins.filter((plugin) => plugin.active);

    for (const plugin of activePlugins) {
      await loadPlugin(plugin.id);
    }
  };

  /**
   * Get plugin component
   * @param pluginId - Plugin ID
   * @returns Component or null
   */
  const getPluginComponent = (pluginId: string) => {
    return pluginComponents.value.get(pluginId) || null;
  };

  /**
   * Clear all plugin cache (useful after upload/update)
   */
  const clearPluginCache = () => {
    loadedPlugins.value.clear();
    pluginComponents.value.clear();
  };

  return {
    getPlugins,
    loadPlugin,
    unloadPlugin,
    loadAllPlugins,
    getPluginComponent,
    clearPluginCache,
    loadedPlugins: readonly(loadedPlugins),
  };
};
