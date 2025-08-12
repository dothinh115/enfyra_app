import { defineEventHandler, getCookie, H3Event } from "h3";
import { ACCESS_TOKEN_KEY } from "~/utils/common/constants";
import { proxyToAPI } from "~/utils/server/proxy";

export default defineEventHandler(async (event: H3Event) => {
  // ✅ Check access_token in cookie
  const accessToken = getCookie(event, ACCESS_TOKEN_KEY);
  if (!accessToken) return null;

  return proxyToAPI(event);
});
