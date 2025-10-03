import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import Prism from 'prismjs';
import { useEffect } from 'react';

import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';

type Role = 'user' | 'assistant' | 'system';

interface Props {
  role: Role;
  content: string;
}

function MessageBubble({ role, content }: Props) {
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  const isUser = role === 'user';

  return (
    <div
      className={clsx('rounded-3xl border px-6 py-5 shadow-lg backdrop-blur', {
        'ml-auto max-w-2xl border-accent/60 bg-accent/30 text-white': isUser,
        'mr-auto max-w-2xl border-white/10 bg-black/40 text-white': !isUser,
      })}
    >
      <div className="text-xs uppercase tracking-[0.3em] text-white/40">{role}</div>
      <div className="prose prose-invert mt-2 max-w-none text-sm leading-relaxed">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

export default MessageBubble;
