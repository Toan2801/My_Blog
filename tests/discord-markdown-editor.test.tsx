import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import DiscordMarkdownEditor from '@/components/DiscordMarkdownEditor';

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
  document.body.innerHTML = '';
});

function mount(initialValue = '', onChangeSpy?: (v: string) => void) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  let currentValue = initialValue;
  const onChange = (v: string) => {
    currentValue = v;
    onChangeSpy?.(v);
    act(() => {
      root.render(
        <DiscordMarkdownEditor value={currentValue} onChange={onChange} placeholder="Write markdown…" />,
      );
    });
  };

  act(() => {
    root.render(
      <DiscordMarkdownEditor value={currentValue} onChange={onChange} placeholder="Write markdown…" />,
    );
  });

  cleanups.push(() => {
    act(() => { root.unmount(); });
  });

  return { container, getCurrent: () => currentValue };
}

describe('DiscordMarkdownEditor', () => {
  it('renders a textarea in write mode by default', () => {
    const { container } = mount();
    expect(container.querySelector('textarea')).toBeTruthy();
    expect(container.querySelector('.dc-md-live')).toBeNull();
  });

  it('fires onChange when the textarea value changes', () => {
    const spy: string[] = [];
    const { container, getCurrent } = mount('', (v) => spy.push(v));

    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    act(() => {
      ta.value = '**bold**';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(getCurrent()).toBe('**bold**');
  });

  it('shows the rendered preview when the preview tab is clicked', () => {
    const { container } = mount('**bold text**');

    const buttons = container.querySelectorAll('.dc-md-editor-tab');
    const previewBtn = Array.from(buttons).find(b => b.textContent?.includes('Xem trước'));
    expect(previewBtn).toBeTruthy();

    act(() => {
      (previewBtn as HTMLButtonElement).click();
    });

    expect(container.querySelector('.dc-md-live')).toBeTruthy();
    expect(container.querySelector('textarea')).toBeNull();
    expect(container.querySelector('strong')?.textContent).toBe('bold text');
  });

  it('preserves the markdown value when switching tabs', () => {
    const { container, getCurrent } = mount('# Hello');

    const buttons = container.querySelectorAll('.dc-md-editor-tab');
    const previewBtn = Array.from(buttons).find(b => b.textContent?.includes('Xem trước'));
    act(() => { (previewBtn as HTMLButtonElement).click(); });

    const writeBtn = Array.from(buttons).find(b => b.textContent?.includes('Viết'));
    act(() => { (writeBtn as HTMLButtonElement).click(); });

    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(ta.value).toBe('# Hello');
    expect(getCurrent()).toBe('# Hello');
  });
});
