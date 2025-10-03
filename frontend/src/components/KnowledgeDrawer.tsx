import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Brain, Upload, FileText, Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const items = [
  {
    id: '1',
    title: 'Design Sprint Summary',
    tags: ['design', 'summary'],
    snippet: 'Key outcomes: Figma prototype ready, audio moodboard curated, team excited about voice gestures.',
  },
  {
    id: '2',
    title: 'Customer Call 02/18',
    tags: ['call', 'insights'],
    snippet: 'Need ultra responsive voice to voice responses and better knowledge management for transcripts.',
  },
];

function KnowledgeDrawer({ open, onClose }: Props) {
  const [activeItem, setActiveItem] = useState('1');

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 flex w-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="ml-auto flex h-full w-full max-w-full flex-col bg-primary-950/95 shadow-2xl backdrop-blur-3xl sm:max-w-2xl lg:max-w-4xl">
                <header className="flex flex-col gap-4 border-b border-white/10 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Memory Vault</p>
                    <Dialog.Title className="mt-2 font-display text-2xl font-semibold text-white">
                      Personalized Retrieval Playground
                    </Dialog.Title>
                  </div>
                  <button onClick={onClose} className="text-sm text-white/60 transition hover:text-white">
                    Close
                  </button>
                </header>
                <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[320px_1fr]">
                  <aside className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:p-8">
                    <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-accent/60 bg-accent/20 px-4 py-3 text-sm font-medium text-white shadow-neon transition hover:bg-accent/30">
                      <Upload className="h-4 w-4" /> Upload Dataset
                    </button>
                    <div className="mt-6 space-y-3">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveItem(item.id)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            activeItem === item.id
                              ? 'border-accent/60 bg-white/10 text-white shadow-neon'
                              : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-accent" />
                            <span className="font-medium">{item.title}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.25em] text-white/40">
                            {item.tags.map((tag) => (
                              <span key={tag} className="rounded-full bg-white/10 px-2 py-1">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </aside>
                  <section className="relative flex flex-col gap-6 overflow-y-auto p-6 sm:p-8 lg:p-10">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-neon sm:p-8">
                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <FileText className="h-5 w-5 text-accent" /> Rich Markdown Preview
                      </h3>
                      <p className="mt-4 text-sm text-white/70">
                        Render Markdown, code blocks, LaTeX formulas and inline images. Perfect for knowledge infusion and
                        visual context.
                      </p>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 text-sm text-white/80 sm:p-8"
                    >
                      <p className="text-xs uppercase tracking-[0.35em] text-white/40">Suggested actions</p>
                      <ul className="mt-3 space-y-2">
                        <li className="flex items-start gap-2">
                          <Sparkles className="mt-1 h-4 w-4 text-accent" />
                          Blend this snippet with the current chat context
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles className="mt-1 h-4 w-4 text-accent" />
                          Generate voice summary using ElevenLabs streaming
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles className="mt-1 h-4 w-4 text-accent" />
                          Push to long-term memory vault for retrieval
                        </li>
                      </ul>
                    </motion.div>
                  </section>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default KnowledgeDrawer;
