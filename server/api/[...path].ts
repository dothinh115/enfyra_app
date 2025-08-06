import { defineEventHandler, H3Event } from "h3";
import { proxyToAPI } from "../../utils/server/proxy";

export default defineEventHandler(async (event: H3Event) => {
  return proxyToAPI(event);
});
