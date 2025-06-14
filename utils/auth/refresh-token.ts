import { getCookie, setCookie, deleteCookie, H3Event, getHeader } from "h3";
import { $fetch } from "ofetch";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  EXP_TIME_KEY,
} from "../constants";

export async function refreshToken(event: H3Event): Promise<string | null> {
  const config = useRuntimeConfig();
  const accessToken = getCookie(event, ACCESS_TOKEN_KEY);
  const expTimeStr = getCookie(event, EXP_TIME_KEY);
  const refToken = getCookie(event, REFRESH_TOKEN_KEY);
  const now = Date.now();

  if (!accessToken || !expTimeStr) return null;

  const expTime = parseInt(expTimeStr);
  if (now < expTime - 10_000) {
    return accessToken;
  }

  try {
    const {
      accessToken: newAccessToken,
      refreshToken,
      expTime,
    } = await $fetch<{
      accessToken: string;
      refreshToken: string;
      expTime: number;
    }>(`${config.public.apiUrl}/auth/refresh-token`, {
      method: "POST",
      headers: {
        cookie: getHeader(event, "cookie") || "",
      },
      body: {
        refreshToken: refToken,
      },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    };

    setCookie(event, ACCESS_TOKEN_KEY, newAccessToken, cookieOptions);
    setCookie(event, REFRESH_TOKEN_KEY, refreshToken, cookieOptions);
    setCookie(event, EXP_TIME_KEY, String(expTime), cookieOptions);

    return newAccessToken;
  } catch (err) {
    console.warn("⚠️ Refresh token failed:", err);

    deleteCookie(event, ACCESS_TOKEN_KEY);
    deleteCookie(event, REFRESH_TOKEN_KEY);
    deleteCookie(event, EXP_TIME_KEY);

    return null;
  }
}
