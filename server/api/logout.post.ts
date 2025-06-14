import {
  defineEventHandler,
  readBody,
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
} from "../../utils/constants";

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig();
  const apiUrl = config.public.apiUrl;

  const refreshToken = getCookie(event, REFRESH_TOKEN_KEY);

  try {
    await $fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      headers: {
        cookie: getHeader(event, "cookie") || "",
      },
      body: {
        refreshToken,
      },
    });
  } catch (err) {
    console.warn("⚠️ Logout failed at backend API", err);
    // không throw — vẫn xoá local cookies
  }

  // ✅ Xóa cookies phía Nuxt
  deleteCookie(event, ACCESS_TOKEN_KEY);
  deleteCookie(event, REFRESH_TOKEN_KEY);
  deleteCookie(event, EXP_TIME_KEY);

  return { success: true };
});
