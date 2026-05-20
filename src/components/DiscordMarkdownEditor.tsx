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
            tab === 'write' ? 'border-b-themed text-themed' : 'text-muted'
          }`}
          onClick={() => setTab('write')}
        >
          Viết
        </button>
        <button
          type="button"
          className={`-mb-px cursor-pointer border-b-2 border-transparent px-3.5 py-2 text-sm font-semibold transition-colors hover:text-subtle ${
            tab === 'preview' ? 'border-b-themed text-themed' : 'text-muted'
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
        <div className="dc-md-live px-5 py-3.5" style={{ minHeight }}>
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
