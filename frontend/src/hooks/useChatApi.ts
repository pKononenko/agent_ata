import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export function useChats() {
  return useQuery({
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
  return useMutation({
    mutationFn: async (payload: { title: string }) => {
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

export function useKnowledgeSearch() {
  return useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`${API_BASE}/knowledge/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
  });
}
