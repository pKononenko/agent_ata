import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import Prism from 'prismjs';
import type { Components } from 'react-markdown';
import { useCallback, useMemo, useState } from 'react';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'katex/dist/katex.min.css';

interface Props {
  role: string;
  content: string;
}

function MessageBubble({ role, content }: Props) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const resetCopied = useCallback(() => {
    setCopiedCode(null);
  }, []);

  const markdownComponents = useMemo<Components>(() => {
    return {
      code({ inline, className, children, ...props }) {
        const text = String(children).replace(/\n$/, '');
        const match = /language-(\w+)/.exec(className || '');
        const language = match?.[1] ?? '';

        if (inline) {
          return (
            <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em] text-white">
              {text}
            </code>
          );
        }

        const highlighted =
          language && Prism.languages[language]
            ? Prism.highlight(text, Prism.languages[language], language)
            : text;

        const isCopied = copiedCode === text;

        const handleCopy = async () => {
          if (typeof navigator === 'undefined' || !navigator.clipboard) {
            console.warn('Clipboard API not available');
            return;
          }

          try {
            await navigator.clipboard.writeText(text);
            setCopiedCode(text);
            setTimeout(resetCopied, 2000);
          } catch (error) {
            console.error('Failed to copy code block', error);
          }
        };

        return (
          <div className="group relative my-5 overflow-hidden rounded-2xl border border-white/10 bg-black/60">
            <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/40">
              <span className="font-mono lowercase text-white/60">{language || 'code'}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-md border border-white/10 px-2 py-1 font-medium tracking-wide text-white/70 transition hover:border-white/30 hover:text-white"
              >
                {isCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="max-h-[520px] overflow-auto px-4 py-4 text-sm leading-relaxed">
              <code
                className={className}
                dangerouslySetInnerHTML={{ __html: highlighted }}
                {...props}
              />
            </pre>
          </div>
        );
      },
      pre({ children }) {
        return <>{children}</>;
      },
      table({ children, ...props }) {
        return (
          <div className="my-6 overflow-hidden rounded-xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm text-white/80" {...props}>
              {children}
            </table>
          </div>
        );
      },
      thead({ children, ...props }) {
        return (
          <thead className="bg-white/5 text-left uppercase tracking-[0.2em] text-white/60" {...props}>
            {children}
          </thead>
        );
      },
      tbody({ children, ...props }) {
        return (
          <tbody className="divide-y divide-white/10" {...props}>
            {children}
          </tbody>
        );
      },
      th({ children, ...props }) {
        return (
          <th className="px-4 py-3 font-semibold" {...props}>
            {children}
          </th>
        );
      },
      td({ children, ...props }) {
        return (
          <td className="px-4 py-3 align-top" {...props}>
            {children}
          </td>
        );
      },
      blockquote({ children, ...props }) {
        return (
          <blockquote className="my-6 border-l-4 border-accent/60 bg-accent/10 px-5 py-3 text-white/80" {...props}>
            {children}
          </blockquote>
        );
      },
      ul({ children, ...props }) {
        return (
          <ul className="my-5 ml-6 list-disc space-y-2 text-sm leading-relaxed" {...props}>
            {children}
          </ul>
        );
      },
      ol({ children, ...props }) {
        return (
          <ol className="my-5 ml-6 list-decimal space-y-2 text-sm leading-relaxed" {...props}>
            {children}
          </ol>
        );
      },
      li({ children, ...props }) {
        return (
          <li className="pl-2 text-white/90" {...props}>
            {children}
          </li>
        );
      },
      p({ children, ...props }) {
        return (
          <p className="my-4 whitespace-pre-wrap text-sm leading-relaxed text-white/90" {...props}>
            {children}
          </p>
        );
      },
      hr(props) {
        return <hr className="my-8 border-t border-white/10" {...props} />;
      },
    };
  }, [copiedCode, resetCopied]);

  const isUser = role === 'user';

  return (
    <div
      className={clsx('w-full max-w-full rounded-3xl border px-5 py-4 shadow-lg backdrop-blur sm:px-6 sm:py-5', {
        'ml-auto border-accent/60 bg-accent/30 text-white sm:max-w-2xl': isUser,
        'mr-auto border-white/10 bg-black/40 text-white sm:max-w-2xl': !isUser,
      })}
    >
      <div className="text-xs uppercase tracking-[0.3em] text-white/40">{role}</div>
      <div className="prose prose-invert mt-2 max-w-none text-sm leading-relaxed prose-headings:font-semibold prose-headings:text-white prose-strong:text-white">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default MessageBubble;
