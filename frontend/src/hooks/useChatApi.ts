import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
  audio_url?: string | null;
}

export interface Chat {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
}

export function useChats() {
  return useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/chats/`);
      if (!response.ok) throw new Error('Unable to load chats');
      return response.json();
    },
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();
  return useMutation<Chat, Error, { title: string }>({
    mutationFn: async (payload) => {
      const response = await fetch(`${API_BASE}/chats/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Unable to create chat');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chats'] }),
  });
}

export function useChatMessages(chatId: string | undefined) {
  return useQuery<Message[]>({
    queryKey: ['chats', chatId, 'messages'],
    enabled: Boolean(chatId),
    queryFn: async () => {
      if (!chatId) throw new Error('Chat ID is required');
      const response = await fetch(`${API_BASE}/chats/${chatId}/messages`);
      if (!response.ok) throw new Error('Unable to load messages');
      return response.json();
    },
  });
}

type MessagePayload = {
  role: string;
  content: string;
  audio_url?: string | null;
};

export function useSendMessage(chatId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<Message, Error, MessagePayload>({
    mutationFn: async (payload) => {
      if (!chatId) throw new Error('Chat ID is required');
      const response = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Unable to send message');
      return response.json();
    },
    onSuccess: (message) => {
      if (!chatId) return;
      queryClient.setQueryData<Message[]>(['chats', chatId, 'messages'], (existing) =>
        existing ? [...existing, message] : [message]
      );
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

export function useKnowledgeSearch() {
  return useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`${API_BASE}/knowledge/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
  });
}
