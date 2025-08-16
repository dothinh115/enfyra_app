import { getCookie, setCookie, deleteCookie, H3Event, getHeader } from "h3";
import { $fetch } from "ofetch";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  EXP_TIME_KEY,
} from "../../common/constants";

export async function refreshToken(event: H3Event): Promise<string | null> {
  const config = useRuntimeConfig();

  const accessToken = getCookie(event, ACCESS_TOKEN_KEY);
  const expTimeStr = getCookie(event, EXP_TIME_KEY);
  const refreshToken = getCookie(event, REFRESH_TOKEN_KEY);
  const now = Date.now();

  // If there's no refreshToken then give up
  if (!refreshToken) {
    return null;
  }

  const expTime = expTimeStr ? parseInt(expTimeStr) : 0;
  const tokenStillValid = accessToken && now < expTime - 10_000;

  // If token is still valid then use it
  if (tokenStillValid) {
    return accessToken!;
  }

  // If token is expired or doesn't exist, go refresh
  try {
    const response: any = await $fetch<{
      accessToken: string;
      refreshToken: string;
      expTime: number;
    }>(`${config.public.apiUrl}/auth/refresh-token`, {
      method: "POST",
      headers: {
        cookie: getHeader(event, "cookie") || "",
      },
      body: {
        refreshToken,
      },
    });

    const {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expTime: newExpTime,
    } = response;

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    };

    setCookie(event, ACCESS_TOKEN_KEY, newAccessToken, cookieOptions);
    setCookie(event, REFRESH_TOKEN_KEY, newRefreshToken, cookieOptions);
    setCookie(event, EXP_TIME_KEY, String(newExpTime), cookieOptions);

    return newAccessToken;
  } catch (err: any) {
    const statusCode = err?.response?.status || err?.statusCode;
    const errorData = err?.response?._data || err?.data;

    // If error has code 401/403 then delete token
    const shouldDelete = statusCode === 401 || statusCode === 403;

    if (shouldDelete) {
      deleteCookie(event, ACCESS_TOKEN_KEY);
      deleteCookie(event, REFRESH_TOKEN_KEY);
      deleteCookie(event, EXP_TIME_KEY);
    }

    return null;
  }
}
