import { useEnfyraAuth } from "../../../sdk/src/composables/useEnfyraAuth";
export function useAuth() {
  // Use new SDK auth system - same API as before
  return useEnfyraAuth();
}
