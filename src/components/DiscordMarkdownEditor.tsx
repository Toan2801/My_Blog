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
    <div className="dc-md-editor">
      <div className="dc-md-editor-tabs">
        <button
          type="button"
          className={`dc-md-editor-tab${tab === 'write' ? ' active' : ''}`}
          onClick={() => setTab('write')}
        >
          Viết
        </button>
        <button
          type="button"
          className={`dc-md-editor-tab${tab === 'preview' ? ' active' : ''}`}
          onClick={() => setTab('preview')}
        >
          Xem trước
        </button>
      </div>
      {tab === 'write' ? (
        <textarea
          className="dc-md-editor-textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
        />
      ) : (
        <div className="dc-md-live dc-md-editor-preview" style={{ minHeight }}>
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <span className="dc-md-editor-placeholder">{placeholder}</span>
          )}
        </div>
      )}
    </div>
  );
}
