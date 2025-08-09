import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";

/**
 * Ensure plugin registry file exists and return its path
 */
export async function ensurePluginRegistry(): Promise<string> {
  const registryPath = getPluginRegistryPath();

  // Check if registry file exists, if not create it
  if (!existsSync(registryPath)) {
    // Ensure plugins directory exists
    const pluginsDir = dirname(registryPath);
    if (!existsSync(pluginsDir)) {
      await mkdir(pluginsDir, { recursive: true });
    }

    // Create empty registry file
    const emptyRegistry = { plugins: [] };
    await writeFile(
      registryPath,
      JSON.stringify(emptyRegistry, null, 2),
      "utf-8"
    );
  }

  return registryPath;
}

/**
 * Read plugin registry with auto-creation if missing
 */
export async function readPluginRegistry(): Promise<{ plugins: any[] }> {
  const registryPath = await ensurePluginRegistry();
  const registryContent = await readFile(registryPath, "utf-8");
  return JSON.parse(registryContent);
}

/**
 * Get plugin registry path (without auto-creation)
 */
function getPluginRegistryPath(): string {
  return join(process.cwd(), "public", "plugins", "plugin-registry.json");
}

/**
 * Write plugin registry to file
 */
export async function writePluginRegistry(registry: {
  plugins: any[];
}): Promise<void> {
  const registryPath = getPluginRegistryPath();

  // Ensure directory exists
  const pluginsDir = dirname(registryPath);
  if (!existsSync(pluginsDir)) {
    await mkdir(pluginsDir, { recursive: true });
  }

  await writeFile(registryPath, JSON.stringify(registry, null, 2), "utf-8");
}
