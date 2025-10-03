import { useState } from 'react';
import { SendHorizonal, AudioLines, Sparkle } from 'lucide-react';
import clsx from 'clsx';

import MessageBubble from './MessageBubble';

const demoMessages = [
  {
    id: '1',
    role: 'assistant',
    content: 'Welcome to **HyperChat Studio**. Drop audio, images or Markdown and I will blend Groq reasoning with ElevenLabs energy.',
  },
  {
    id: '2',
    role: 'user',
    content: 'Summarize the notes from our latest design jam and prep follow-up tasks.',
  },
];

function ChatWindow() {
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-16 py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {demoMessages.map((message) => (
            <MessageBubble key={message.id} role={message.role} content={message.content} />
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 bg-black/30 px-16 py-8">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-4">
          <div className="flex flex-1 items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 shadow-neon">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={2}
              placeholder="Type, paste Markdown, or drop voice notes to blend into your memory vault..."
              className="h-full w-full resize-none bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary-950 shadow-lg transition hover:bg-accent/90">
              <SendHorizonal className="h-5 w-5" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:border-white/30 hover:bg-white/20">
              <AudioLines className="h-5 w-5" />
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:border-white/30 hover:bg-white/20">
              <Sparkle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
