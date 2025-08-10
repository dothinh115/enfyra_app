import {
  defineEventHandler,
  readBody,
  setCookie,
  H3Event,
  createError,
  sendError,
  getHeader,
} from "h3";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  EXP_TIME_KEY,
} from "../../utils/constants";
import type { AuthResponse } from "../../utils/server/types";

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig();
  const apiUrl = config.public.apiUrl;
  try {
    const body = await readBody(event);

    const response = await $fetch<AuthResponse>(`${apiUrl}/auth/login`, {
      method: "POST",
      body,
      headers: {
        cookie: getHeader(event, "cookie") || "",
      },
    });
    const { accessToken, refreshToken, expTime } = response;

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    };

    setCookie(event, ACCESS_TOKEN_KEY, accessToken, cookieOptions);
    setCookie(event, REFRESH_TOKEN_KEY, refreshToken, cookieOptions);
    setCookie(event, EXP_TIME_KEY, String(expTime), cookieOptions);

    return { accessToken };
  } catch (err: any) {
    // Extract error details from backend error response
    const statusCode = err?.response?.status || err?.statusCode || 401;
    const errorData = err?.response?._data || err?.data;

    let errorMessage = "Authentication failed";
    let errorCode = "AUTHENTICATION_ERROR";

    if (errorData?.error) {
      errorMessage =
        errorData.error.message || errorData.message || errorMessage;
      errorCode = errorData.error.code || errorCode;
    }

    return sendError(
      event,
      createError({
        statusCode,
        statusMessage: errorMessage,
        data: {
          code: errorCode,
          details: errorData?.error?.details,
          correlationId: errorData?.error?.correlationId,
        },
      })
    );
  }
});
