import { useOnlineStatusContext } from "@/contexts/OnlineStatusContext";

export function useOnlineStatus() {
  return useOnlineStatusContext();
}
