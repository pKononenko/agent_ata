import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Waves, LibraryBig, Settings, Plus } from 'lucide-react';
import clsx from 'clsx';
import { PanelMode } from '../App';
import { useChats, useCreateChat } from '../hooks/useChatApi';

interface Props {
  onOpenDrawer: () => void;
  onSwitchMode: (mode: PanelMode) => void;
  activeMode: PanelMode;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

function ChatSidebar({ onOpenDrawer, onSwitchMode, activeMode, selectedChatId, onSelectChat }: Props) {
  const { data: chats, isLoading, isError } = useChats();
  const createChatMutation = useCreateChat();

  useEffect(() => {
    if (!selectedChatId && chats && chats.length > 0) {
      onSelectChat(chats[0].id);
    }
  }, [chats, onSelectChat, selectedChatId]);

  const handleCreateChat = async () => {
    if (createChatMutation.isPending) return;
    try {
      const title = `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const created = await createChatMutation.mutateAsync({ title });
      onSelectChat(created.id);
    } catch (error) {
      console.error('Unable to create chat', error);
    }
  };

  return (
    <aside className="flex w-full max-w-full flex-col border-b border-white/10 bg-black/40 backdrop-blur-2xl md:w-[320px] md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-5 sm:px-6">
        <div className="max-w-xs">
          <h2 className="font-display text-base font-semibold text-white sm:text-lg">Session Deck</h2>
          <p className="text-xs text-white/60">Switch between calls, chats and curated memory</p>
        </div>
        <button
          onClick={handleCreateChat}
          disabled={createChatMutation.isPending}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <div className="px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSwitchMode('chat')}
            className={clsx(
              'group flex flex-col items-start gap-2 rounded-2xl border px-4 py-4 text-left transition',
              activeMode === 'chat'
                ? 'border-accent/80 bg-white/10 shadow-neon'
                : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
            )}
          >
            <MessageCircle className="h-5 w-5 text-accent" />
            <span className="font-medium text-white">Chat Studio</span>
            <span className="text-xs text-white/50">Groq stream + Markdown</span>
          </button>
          <button
            onClick={() => onSwitchMode('call')}
            className={clsx(
              'group flex flex-col items-start gap-2 rounded-2xl border px-4 py-4 text-left transition',
              activeMode === 'call'
                ? 'border-accent/80 bg-white/10 shadow-neon'
                : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
            )}
          >
            <Waves className="h-5 w-5 text-accent" />
            <span className="font-medium text-white">Voice Arena</span>
            <span className="text-xs text-white/50">ElevenLabs live streaming</span>
          </button>
        </div>
      </div>
      <div className="mt-6 flex-1 overflow-y-auto px-2">
        <p className="px-4 text-xs uppercase tracking-[0.3em] text-white/40">Active sessions</p>
        {(isLoading || isError || (chats && chats.length === 0)) && (
          <div className="px-2 py-4 text-center text-xs text-white/60">
            {isLoading && <span>Loading chats…</span>}
            {isError && <span>Unable to load chats</span>}
            {!isLoading && !isError && chats && chats.length === 0 && <span>No chats yet. Create one to begin.</span>}
          </div>
        )}
        <AnimatePresence>
          {chats?.map((chat) => (
            <motion.button
              layout
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={clsx(
                'mt-3 flex w-full flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition',
                selectedChatId === chat.id ? 'border-white/20 bg-white/10' : 'border-transparent bg-white/5 hover:border-white/10'
              )}
            >
              <span className="font-medium text-white">{chat.title}</span>
              <span className="text-xs text-white/50">
                {(() => {
                  const createdAt = new Date(chat.created_at);
                  return Number.isNaN(createdAt.getTime()) ? 'Unknown time' : createdAt.toLocaleString();
                })()}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      <div className="border-t border-white/10 px-4 py-5 sm:px-6">
        <button
          onClick={onOpenDrawer}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/20"
        >
          <span className="flex items-center gap-2">
            <LibraryBig className="h-4 w-4 text-accent" /> Memory Vault
          </span>
          <span className="text-xs text-white/60">Shift + K</span>
        </button>
        <button className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white/60 transition hover:border-white/20 hover:bg-white/10">
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Control Center
          </span>
          <span className="text-xs text-white/50">Soon</span>
        </button>
      </div>
    </aside>
  );
}

export default ChatSidebar;
