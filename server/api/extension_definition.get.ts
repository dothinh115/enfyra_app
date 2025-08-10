import { proxyToAPI } from "../../utils/server/proxy";

export default defineEventHandler(async (event) => {
  // Simply proxy GET requests without modification
  return proxyToAPI(event);
});