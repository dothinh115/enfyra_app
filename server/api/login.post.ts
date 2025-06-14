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

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig();
  const apiUrl = config.public.apiUrl;
  try {
    const body = await readBody(event);

    const response: any = await $fetch<{
      accessToken: string;
      refreshToken: string;
      expTime: number;
    }>(`${apiUrl}/auth/login`, {
      method: "POST",
      body,
      headers: {
        cookie: getHeader(event, "cookie") || "",
      },
    });
    const { accessToken, refreshToken, expTime } = response.data;
    console.log(response.data);

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
    console.error("❌ Login failed", err);
    return sendError(
      event,
      createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      })
    );
  }
});
