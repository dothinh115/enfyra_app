import { getCookie, H3Event } from "h3";
import { ACCESS_TOKEN_KEY } from "../constants";

export async function checkPluginPermission(
  event: H3Event,
  requiredMethod: string
) {
  const accessToken = getCookie(event, ACCESS_TOKEN_KEY);
  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized - No access token",
    });
  }

  try {
    const config = useRuntimeConfig();
    const apiUrl = config.public.apiUrl;

    // Sử dụng headers từ middleware (đã có authorization)
    const headers = event.context.proxyHeaders || {};

    const response = await $fetch(
      `${apiUrl}/me?fields=*,role.*,role.routePermissions.*,role.routePermissions.methods.*,role.routePermissions.route.*`,
      {
        method: "GET",
        headers,
      }
    );

    const user = (response as any)?.data?.[0];
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "User not found",
      });
    }

    // Root admin has all permissions
    if (user.isRootAdmin) {
      return user;
    }

    // Check if user has permission to access /plugin_registry
    if (!user.role?.routePermissions) {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied. No role permissions found.",
      });
    }

    const pluginRoutePermissions = user.role.routePermissions.filter(
      (permission: any) =>
        permission.route?.path === "/plugin_registry" && permission.isEnabled
    );

    if (!pluginRoutePermissions.length) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Access denied. No permission to access plugin management.",
      });
    }

    // Check if user has the required method permission
    const hasMethodPermission = pluginRoutePermissions.some((permission: any) =>
      permission.methods.some(
        (methodObj: any) => methodObj.method === requiredMethod
      )
    );

    if (!hasMethodPermission) {
      throw createError({
        statusCode: 403,
        statusMessage: `Access denied. No permission for ${requiredMethod} on plugin management.`,
      });
    }

    return user;
  } catch (error: any) {
    // Nếu đã là createError thì re-throw
    if (error.statusCode) {
      throw error;
    }

    // Lỗi khác (network, parsing, etc.)
    throw createError({
      statusCode: 403,
      statusMessage: "Authentication failed",
    });
  }
}

export async function checkAccessToken(event: H3Event) {
  const accessToken = getCookie(event, ACCESS_TOKEN_KEY);
  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized - Access token required",
    });
  }

  try {
    const config = useRuntimeConfig();
    const apiUrl = config.public.apiUrl;

    // Sử dụng headers từ middleware
    const headers = event.context.proxyHeaders || {};

    const response = await $fetch(
      `${apiUrl}/me?fields=*,role.*,role.routePermissions.*,role.routePermissions.methods.*,role.routePermissions.route.*`,
      {
        method: "GET",
        headers,
      }
    );

    const user = (response as any)?.data?.[0];
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "User not found",
      });
    }

    // Root admin has all permissions
    if (user.isRootAdmin) {
      return user;
    }

    // Check if user has permission to access /plugin_registry
    if (!user.role?.routePermissions) {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied. No role permissions found.",
      });
    }

    const pluginRoutePermissions = user.role.routePermissions.filter(
      (permission: any) =>
        permission.route?.path === "/plugin_registry" && permission.isEnabled
    );

    if (!pluginRoutePermissions.length) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Access denied. No permission to access plugin management.",
      });
    }

    // For file serving, just need any plugin permission (read is enough)
    return user;
  } catch (error: any) {
    // Nếu đã là createError thì re-throw
    if (error.statusCode) {
      throw error;
    }

    // Lỗi khác (network, parsing, etc.)
    throw createError({
      statusCode: 403,
      statusMessage: "Authentication failed",
    });
  }
}
