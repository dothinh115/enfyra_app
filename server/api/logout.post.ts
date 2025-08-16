import {
  defineEventHandler,
  getHeader,
  getCookie,
  deleteCookie,
  H3Event,
} from "h3";
import { useRuntimeConfig } from "#imports";
import { $fetch } from "ofetch";
import {
  REFRESH_TOKEN_KEY,
  ACCESS_TOKEN_KEY,
  EXP_TIME_KEY,
} from "~/utils/common/constants";

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig();
  const apiUrl = config.public.apiUrl;

  const refreshToken = getCookie(event, REFRESH_TOKEN_KEY);

  try {
    const result = await $fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      headers: {
        cookie: getHeader(event, "cookie") || "",
        authorization: event.context.proxyHeaders.authorization,
      },
      body: {
        refreshToken,
      },
    });
    // ✅ Delete cookies on Nuxt side
    deleteCookie(event, ACCESS_TOKEN_KEY);
    deleteCookie(event, REFRESH_TOKEN_KEY);
    deleteCookie(event, EXP_TIME_KEY);
    return result;
  } catch (err: any) {
    const statusCode = err?.response?.status || err?.statusCode;
    const errorData = err?.response?._data || err?.data;

    // don't throw — still delete local cookies
    return { success: false, message: "Logout completed locally" };
  }
});
