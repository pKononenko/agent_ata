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

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ChatSidebar onOpenDrawer={() => setDrawerOpen(true)} onSwitchMode={setMode} activeMode={mode} />
      <main className="relative flex flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-32 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
        </div>
        <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-black/20 px-12 py-6 backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary-100/80">Hyper Real-Time Intelligence</p>
            <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-semibold text-white">
              <Sparkles className="h-6 w-6 text-accent" /> HyperChat Studio
            </h1>
          </div>
          <div className="flex items-center gap-4">
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
          <AnimatePresence mode="wait">{mode === 'chat' ? <ChatWindow key="chat" /> : <CallPanel key="call" />}</AnimatePresence>
        </section>
      </main>
      <KnowledgeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

export default App;
