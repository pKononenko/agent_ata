import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, PlusCircle, Brain, Mic, Image as ImageIcon } from 'lucide-react';
import ChatSidebar from './components/ChatSidebar';
import ChatWindow from './components/ChatWindow';
import KnowledgeDrawer from './components/KnowledgeDrawer';
import CallPanel from './components/CallPanel';

export type PanelMode = 'chat' | 'call';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<PanelMode>('chat');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden bg-primary-950 md:flex-row">
      <ChatSidebar
        onOpenDrawer={() => setDrawerOpen(true)}
        onSwitchMode={setMode}
        activeMode={mode}
        selectedChatId={activeChatId}
        onSelectChat={setActiveChatId}
      />
      <main className="relative flex flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-10 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl md:left-32 md:h-96 md:w-96" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-accent/25 blur-3xl sm:h-72 sm:w-72 md:h-80 md:w-80" />
        </div>
        <header className="relative z-10 flex flex-col gap-4 border-b border-white/10 bg-black/20 px-6 py-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:px-12">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-primary-100/80">Hyper Real-Time Intelligence</p>
            <h1 className="flex items-center gap-3 font-display text-2xl font-semibold text-white sm:text-3xl">
              <Sparkles className="h-6 w-6 text-accent" /> HyperChat Studio
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <button className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/10">
              <ImageIcon className="h-4 w-4 text-accent" />
              Upload Media
            </button>
            <button className="flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-primary-950 shadow-neon transition hover:bg-accent/90">
              <PlusCircle className="h-4 w-4" /> New Memory
            </button>
          </div>
        </header>
        <section className="relative z-10 flex flex-1">
          <AnimatePresence mode="wait">
            {mode === 'chat' ? <ChatWindow key="chat" chatId={activeChatId ?? undefined} /> : <CallPanel key="call" />}
          </AnimatePresence>
        </section>
      </main>
      <KnowledgeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

export default App;
