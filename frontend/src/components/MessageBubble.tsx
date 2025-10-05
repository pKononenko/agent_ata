import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import Prism from 'prismjs';
import { useEffect } from 'react';

import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';

interface Props {
  role: string;
  content: string;
}

function MessageBubble({ role, content }: Props) {
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  const isUser = role === 'user';

  return (
    <div
      className={clsx('w-full max-w-full rounded-3xl border px-5 py-4 shadow-lg backdrop-blur sm:px-6 sm:py-5', {
        'ml-auto border-accent/60 bg-accent/30 text-white sm:max-w-2xl': isUser,
        'mr-auto border-white/10 bg-black/40 text-white sm:max-w-2xl': !isUser,
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
