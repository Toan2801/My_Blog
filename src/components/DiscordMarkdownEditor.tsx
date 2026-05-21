'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function DiscordMarkdownEditor({ value, onChange, placeholder, minHeight = 200 }: Props) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  return (
    <div className="flex flex-col">
      <div className="flex border-b border-normal px-5">
        <button
          type="button"
          className={`-mb-px cursor-pointer border-b-2 border-transparent px-3.5 py-2 text-sm font-semibold transition-colors hover:text-subtle ${
            tab === 'write' ? 'border-themed text-themed' : 'text-muted'
          }`}
          onClick={() => setTab('write')}
        >
          Viết
        </button>
        <button
          type="button"
          className={`-mb-px cursor-pointer border-b-2 border-transparent px-3.5 py-2 text-sm font-semibold transition-colors hover:text-subtle ${
            tab === 'preview' ? 'border-themed text-themed' : 'text-muted'
          }`}
          onClick={() => setTab('preview')}
        >
          Xem trước
        </button>
      </div>
      {tab === 'write' ? (
        <textarea
          className="box-border w-full resize-y bg-transparent px-5 py-3.5 font-mono text-sm leading-6 text-normal outline-none placeholder:text-muted"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
        />
      ) : (
        <div 
          className="
            w-full break-words select-text bg-transparent px-5 py-3.5
            text-base/5.5 font-medium outline-none text-normal

            [&_p]:mb-2

            [&_a]:break-words
            [&_a]:cursor-pointer
            [&_a]:no-underline
            [&_a]:text-blue-600

            [&_strong]:font-bold
            [&_em]:italic

            [&_pre]:box-border
            [&_pre]:max-w-9/10
            [&_pre]:mt-1.5
            [&_pre]:rounded
            [&_pre]:p-0
            [&_pre]:text-xs
            [&_pre]:font-mono
            [&_pre]:leading-4
            [&_pre]:whitespace-pre-wrap

            [&_blockquote]:box-border
            [&_blockquote]:max-w-9/10
            [&_blockquote]:my-1.5
            [&_blockquote]:indent-0
            [&_blockquote]:border-l-4
            [&_blockquote]:border-solid
            [&_blockquote]:border-gray-300
            dark:[&_blockquote]:border-gray-600
            [&_blockquote]:pl-4
            [&_blockquote]:pr-3
            [&_blockquote]:text-neutral-700
            dark:[&_blockquote]:text-neutral-300

            [&_blockquote_pre]:max-w-full

            [&_code]:border
            [&_code]:indent-0
            [&_code]:whitespace-pre-wrap
            [&_code]:text-sm
            [&_code]:leading-5
            [&_code]:bg-indigo-500/5
            dark:[&_code]:bg-indigo-500/10
            [&_code]:border-[var(--border-normal)]

            [&_code.inline]:-my-1
            [&_code.inline]:mx-0
            [&_code.inline]:h-auto
            [&_code.inline]:w-auto
            [&_code.inline]:rounded
            [&_code.inline]:border
            [&_code.inline]:px-1
            [&_code.inline]:py-0
            [&_code.inline]:text-sm
            [&_code.inline]:font-mono
            [&_code.inline]:leading-5
            [&_code.inline]:indent-0
            [&_code.inline]:whitespace-pre-wrap
            [&_code.inline]:bg-indigo-500/5
            dark:[&_code.inline]:bg-indigo-500/10
            [&_code.inline]:border-[var(--border-normal)]

            [&_li]:mb-1
            [&_li]:whitespace-break-spaces

            [&_ul]:mt-1
            [&_ul]:mb-0
            [&_ul]:list-outside
            [&_ul]:list-disc

            [&_ol]:mt-1
            [&_ol]:mb-0
            [&_ol]:list-outside
            [&_ol]:list-decimal

            [&_ul_ul]:mb-0
            [&_ul_ul]:list-[circle]

            [&_ol_ul]:mb-0
            [&_ol_ul]:list-[circle]

            [&_ul_ol]:mb-0
            [&_ol_ol]:mb-0

            [&_h1]:mx-0
            [&_h1]:mt-4
            [&_h1]:mb-2
            [&_h1]:text-2xl
            [&_h1]:leading-5
            [&_h1]:font-bold
            [&_h1]:text-neutral-950
            dark:[&_h1]:text-neutral-50

            [&_h2]:mx-0
            [&_h2]:mt-4
            [&_h2]:mb-2
            [&_h2]:text-xl
            [&_h2]:leading-5
            [&_h2]:font-bold
            [&_h2]:text-neutral-950
            dark:[&_h2]:text-neutral-50

            [&_h3]:mx-0
            [&_h3]:mt-4
            [&_h3]:mb-2
            [&_h3]:text-base
            [&_h3]:leading-5
            [&_h3]:font-bold
            [&_h3]:text-neutral-950
            dark:[&_h3]:text-neutral-50

            [&_h4]:mx-0
            [&_h4]:mt-4
            [&_h4]:mb-1
            [&_h4]:leading-5
            [&_h4]:font-bold
            [&_h4]:text-neutral-950
            dark:[&_h4]:text-neutral-50

            [&_h5]:mx-0
            [&_h5]:mt-4
            [&_h5]:mb-1
            [&_h5]:leading-5
            [&_h5]:font-bold
            [&_h5]:text-neutral-950
            dark:[&_h5]:text-neutral-50

            [&_h6]:mx-0
            [&_h6]:mt-4
            [&_h6]:mb-1
            [&_h6]:leading-5
            [&_h6]:font-bold
            [&_h6]:text-neutral-950
            dark:[&_h6]:text-neutral-50

            [&_h1:first-child]:mt-2
            [&_h2:first-child]:mt-2

            [&_h3:first-child]:mt-1
            [&_h4:first-child]:mt-1
            [&_h5:first-child]:mt-1
            [&_h6:first-child]:mt-1
          " 
          style={{ minHeight }}
        >
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <span className="text-muted">{placeholder}</span>
          )}
        </div>
      )}
    </div>
  );
}
