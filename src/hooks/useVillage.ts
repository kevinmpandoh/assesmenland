import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLeaderboard,
  getChatMessages,
  sendChatMessage,
  getRecentCatches,
} from "@/lib/api/game.functions";

// Live village data — leaderboard, chat, and the activity feed all poll
// the server API. Polling keeps the stack simple; swap for Supabase
// Realtime later if you want instant updates.

export function useLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: () => getLeaderboard({ data: { limit } }),
    refetchInterval: 15_000,
    retry: 1,
  });
}

export function useRecentCatches() {
  return useQuery({
    queryKey: ["recent-catches"],
    queryFn: () => getRecentCatches(),
    refetchInterval: 15_000,
    retry: 1,
  });
}

export function useChat() {
  const queryClient = useQueryClient();

  const messages = useQuery({
    queryKey: ["chat"],
    queryFn: () => getChatMessages(),
    refetchInterval: 5_000,
    retry: 1,
  });

  const send = useMutation({
    mutationFn: (vars: { wallet: string; body: string }) => sendChatMessage({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat"] }),
  });

  return { messages, send };
}
