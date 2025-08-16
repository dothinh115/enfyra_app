import { proxyToAPI } from "../../app/utils/server/proxy";

export default defineEventHandler(async (event) => {
  // Simply proxy GET requests without modification
  return proxyToAPI(event);
});