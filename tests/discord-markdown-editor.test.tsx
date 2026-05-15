import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import DiscordMarkdownEditor from '@/components/DiscordMarkdownEditor';

function setCaretToEnd(el: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
  document.body.innerHTML = '';
});

describe('DiscordMarkdownEditor', () => {
  it('applies markdown formatting immediately after typing markdown syntax', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const root: Root = createRoot(container);
    let currentValue = '';

    const renderEditor = () => {
      act(() => {
        root.render(
          <DiscordMarkdownEditor
            value={currentValue}
            onChange={(nextValue) => {
              currentValue = nextValue;
              renderEditor();
            }}
          />,
        );
      });
    };

    cleanups.push(() => {
      act(() => {
        root.unmount();
      });
    });

    renderEditor();

    const editor = container.querySelector('.dc-md-live');
    expect(editor).toBeTruthy();
    if (!editor) return;

    editor.textContent = '**bold text**';
    editor.focus();
    setCaretToEnd(editor);

    act(() => {
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(currentValue).toBe('**bold text**');
    expect(editor.innerHTML).toContain('<strong>bold text</strong>');
    expect(editor.textContent?.trim()).toBe('bold text');
  });
});