import { FormEvent, useMemo, useState } from 'react';
import { SendHorizonal, AudioLines, Sparkle } from 'lucide-react';
import clsx from 'clsx';

import MessageBubble from './MessageBubble';
import {
  useChatMessages,
  useSendMessage,
  streamCompletion,
  type Message,
} from '../hooks/useChatApi';

interface Props {
  chatId?: string;
}

function ChatWindow({ chatId }: Props) {
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const { data: messages, isLoading, isError } = useChatMessages(chatId);
  const userMessageMutation = useSendMessage(chatId);
  const assistantMessageMutation = useSendMessage(chatId);

  const displayMessages = useMemo(() => {
    if (!streamingContent) {
      return messages;
    }

    const streamingMessage: Message = {
      id: 'streaming',
      role: 'assistant',
      content: streamingContent,
      created_at: new Date().toISOString(),
      audio_url: null,
    };

    return [...(messages ?? []), streamingMessage];
  }, [messages, streamingContent]);

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!chatId || !input.trim() || userMessageMutation.isPending || isStreaming) return;

    try {
      const content = input.trim();
      await userMessageMutation.mutateAsync({ role: 'user', content });
      setInput('');

      setIsStreaming(true);
      setStreamingContent('');
      const assistantReply = await streamCompletion(chatId, {
        onToken: (token) => {
          setStreamingContent((prev) => (prev ?? '') + token);
        },
      });

      if (assistantReply.trim()) {
        await assistantMessageMutation.mutateAsync({ role: 'assistant', content: assistantReply });
      }
    } catch (error) {
      console.error('Unable to send message', error);
    } finally {
      setStreamingContent(null);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-10 sm:py-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {!chatId && <p className="text-sm text-white/60">Create or select a chat to get started.</p>}
          {chatId && isLoading && <p className="text-sm text-white/60">Loading conversation…</p>}
          {chatId && isError && <p className="text-sm text-red-400">Unable to load messages.</p>}
          {chatId && !isLoading && !isError && messages?.length === 0 && (
            <p className="text-sm text-white/60">No messages yet. Say hello to kick things off!</p>
          )}
          {displayMessages?.map((message) => (
            <MessageBubble key={message.id} role={message.role} content={message.content} />
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 bg-black/30 px-4 py-6 sm:px-10 sm:py-8 lg:px-16">
        <form
          onSubmit={handleSend}
          className="mx-auto flex w-full max-w-3xl flex-col items-stretch gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex flex-1 items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 shadow-neon">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={2}
              placeholder={chatId ? 'Type, paste Markdown, or drop voice notes to blend into your memory vault...' : 'Create or select a chat to begin.'}
              disabled={!chatId}
              className="h-full w-full resize-none bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!chatId || !input.trim() || userMessageMutation.isPending || isStreaming}
              className={clsx(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-primary-950 shadow-lg transition',
                !chatId || !input.trim() || userMessageMutation.isPending || isStreaming
                  ? 'bg-accent/40 cursor-not-allowed'
                  : 'bg-accent hover:bg-accent/90'
              )}
            >
              <SendHorizonal className="h-5 w-5" />
            </button>
          </div>
          <div className="flex gap-3 self-end">
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:border-white/30 hover:bg-white/20">
              <AudioLines className="h-5 w-5" />
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:border-white/30 hover:bg-white/20">
              <Sparkle className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;
