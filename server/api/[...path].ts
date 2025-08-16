import { proxyToAPI } from "../../app/utils/server/proxy";

export default defineEventHandler(async (event) => {
  return proxyToAPI(event);
});
