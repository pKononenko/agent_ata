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

interface StreamOptions {
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

export async function streamCompletion(
  chatId: string | undefined,
  options?: StreamOptions,
): Promise<string> {
  if (!chatId) throw new Error('Chat ID is required');

  const response = await fetch(`${API_BASE}/chats/${chatId}/stream`, {
    method: 'POST',
    headers: { Accept: 'text/event-stream' },
    signal: options?.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error('Unable to stream completion');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let accumulated = '';

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let eventBoundary = buffer.indexOf('\n\n');
      while (eventBoundary !== -1) {
        const rawEvent = buffer.slice(0, eventBoundary).trim();
        buffer = buffer.slice(eventBoundary + 2);

        if (!rawEvent.startsWith('data:')) {
          eventBoundary = buffer.indexOf('\n\n');
          continue;
        }

        const payload = rawEvent.slice(5).trim();
        if (!payload) {
          eventBoundary = buffer.indexOf('\n\n');
          continue;
        }

        try {
          const parsed = JSON.parse(payload);
          const choice = parsed?.choices?.[0];
          const deltaContent: string | undefined = choice?.delta?.content;
          const finishReason: string | null | undefined = choice?.finish_reason;

          if (deltaContent) {
            accumulated += deltaContent;
            options?.onToken?.(deltaContent);
          }

          if (finishReason) {
            return accumulated;
          }
        } catch (error) {
          console.error('Unable to parse streaming chunk', error);
        }

        eventBoundary = buffer.indexOf('\n\n');
      }
    }

    if (buffer) {
      try {
        const parsed = JSON.parse(buffer.replace(/^data:\s*/, ''));
        const deltaContent: string | undefined = parsed?.choices?.[0]?.delta?.content;
        if (deltaContent) {
          accumulated += deltaContent;
          options?.onToken?.(deltaContent);
        }
      } catch (error) {
        console.error('Unable to parse trailing streaming chunk', error);
      }
    }

    return accumulated;
  } finally {
    reader.releaseLock();
  }
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
