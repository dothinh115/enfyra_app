import { defineEventHandler, getCookie } from "h3";
import { ACCESS_TOKEN_KEY } from "../../app/utils/common/constants";
import { proxyToAPI } from "../../app/utils/server/proxy";

export default defineEventHandler(async (event) => {
  // ✅ Check access_token in cookie
  const accessToken = getCookie(event, ACCESS_TOKEN_KEY);
  if (!accessToken) return null;

  return proxyToAPI(event);
});
