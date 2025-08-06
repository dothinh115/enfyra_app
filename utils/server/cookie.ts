import { H3Event, setCookie, deleteCookie } from "h3";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  EXP_TIME_KEY,
} from "../constants";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(
  event: H3Event,
  accessToken: string,
  refreshToken: string,
  expTime: number
) {
  setCookie(event, ACCESS_TOKEN_KEY, accessToken, cookieOptions);
  setCookie(event, REFRESH_TOKEN_KEY, refreshToken, cookieOptions);
  setCookie(event, EXP_TIME_KEY, String(expTime), cookieOptions);
}

export function deleteAuthCookies(event: H3Event) {
  deleteCookie(event, ACCESS_TOKEN_KEY);
  deleteCookie(event, REFRESH_TOKEN_KEY);
  deleteCookie(event, EXP_TIME_KEY);
}