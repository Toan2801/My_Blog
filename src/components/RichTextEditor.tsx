'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { ResizableImage } from './extensions/ResizableImage';
import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, 
  Link as LinkIcon, Undo, Redo, 
  Type, Palette, Image as ImageIcon,
  FileText, AlignLeft, AlignCenter, AlignRight,
  Hash, Maximize, Minimize, MoveHorizontal
} from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
  onAddFootnote?: () => void;
}

export interface RichTextEditorRef {
  insertFootnote: (num: number) => void;
}

const MenuBar = ({ editor, onAddFootnote }: { editor: any, onAddFootnote?: () => void }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Nhập URL ảnh:');
    if (url) {
      const caption = window.prompt('Nhập chú thích bài viết (không bắt buộc):') || '';
      editor.chain().focus().setImage({ src: url, caption }).run();
    }
  };

  const setWidth = (width: string) => {
    editor.chain().focus().updateAttributes('image', { width }).run();
  };

  const toggleAlign = (alignment: string) => {
    if (editor.isActive('image')) {
      editor.chain().focus().updateAttributes('image', { textAlign: alignment }).run();
    } else {
      editor.chain().focus().setTextAlign(alignment).run();
    }
  };

  const isImageSelected = editor.isActive('image');

  return (
    <div className="editor-toolbar">
      <div className="toolbar-group">
        <select 
          onChange={(e) => {
            const font = e.target.value;
            if (font === 'default') editor.chain().focus().unsetFontFamily().run();
            else editor.chain().focus().setFontFamily(font).run();
          }}
          className="toolbar-select"
          title="Phông chữ"
        >
          <option value="default">Phông hệ thống</option>
          <option value="Playfair Display">Playfair Display</option>
          <option value="Lora">Lora</option>
          <option value="Inter">Inter</option>
          <option value="monospace">Monospace</option>
        </select>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive('paragraph') ? 'is-active' : ''}
          title="Văn bản thường"
        >
          <Type size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          title="Tiêu đề 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          title="Tiêu đề 2"
        >
          <Heading2 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
          title="Tiêu đề 3"
        >
          <Heading3 size={18} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title="In đậm"
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title="In nghiêng"
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active' : ''}
          title="Gạch chân"
        >
          <UnderlineIcon size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '5px' }}>
          <input
            type="color"
            onInput={e => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            title="Màu chữ"
            style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
          />
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => toggleAlign('left')}
          className={editor.isActive({ textAlign: 'left' }) || (isImageSelected && editor.getAttributes('image').textAlign === 'left') ? 'is-active' : ''}
          title="Căn trái"
        >
          <AlignLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => toggleAlign('center')}
          className={editor.isActive({ textAlign: 'center' }) || (isImageSelected && editor.getAttributes('image').textAlign === 'center') ? 'is-active' : ''}
          title="Căn giữa"
        >
          <AlignCenter size={18} />
        </button>
        <button
          type="button"
          onClick={() => toggleAlign('right')}
          className={editor.isActive({ textAlign: 'right' }) || (isImageSelected && editor.getAttributes('image').textAlign === 'right') ? 'is-active' : ''}
          title="Căn phải"
        >
          <AlignRight size={18} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="Danh sách dấu chấm"
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="Danh sách số"
        >
          <ListOrdered size={18} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={editor.isActive('heading', { level: 4 }) ? 'is-active' : ''}
          title="Đoạn tóm tắt (Overview)"
        >
          <FileText size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          title="Trích dẫn sử liệu (Cite)"
        >
          <Quote size={18} />
        </button>
        <button
          type="button"
          onClick={() => onAddFootnote?.()}
          title="Thêm chú thích chân trang"
        >
          <Hash size={18} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={addImage}
          title="Chèn ảnh vào nội dung"
        >
          <ImageIcon size={18} />
        </button>
        
        {isImageSelected && (
          <div className="toolbar-group image-controls">
            <div className="toolbar-divider" />
            <button type="button" onClick={() => setWidth('25%')} title="Cỡ 25%" className={editor.getAttributes('image').width === '25%' ? 'is-active' : ''}>25%</button>
            <button type="button" onClick={() => setWidth('50%')} title="Cỡ 50%" className={editor.getAttributes('image').width === '50%' ? 'is-active' : ''}>50%</button>
            <button type="button" onClick={() => setWidth('75%')} title="Cỡ 75%" className={editor.getAttributes('image').width === '75%' ? 'is-active' : ''}>75%</button>
            <button type="button" onClick={() => setWidth('100%')} title="Cỡ 100%" className={editor.getAttributes('image').width === '100%' ? 'is-active' : ''}>100%</button>
            <div className="toolbar-divider" />
            <button 
              type="button" 
              onClick={() => {
                const isFramed = editor.getAttributes('image').className?.includes('historical-frame');
                editor.chain().focus().updateAttributes('image', { 
                  className: isFramed ? '' : 'historical-frame' 
                }).run();
              }} 
              title="Khung cổ điển" 
              className={editor.getAttributes('image').className?.includes('historical-frame') ? 'is-active' : ''}
            >
              <Maximize size={18} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Nhập URL:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          className={editor.isActive('link') ? 'is-active' : ''}
          title="Gắn link"
        >
          <LinkIcon size={18} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button type="button" onClick={() => editor.chain().focus().undo().run()} title="Quay lại">
          <Undo size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} title="Tiến tới">
          <Redo size={18} />
        </button>
      </div>
    </div>
  );
};

const RichTextEditor = forwardRef<RichTextEditorRef, Props>(({ content, onChange, onAddFootnote }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Color,
      ResizableImage.configure({
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Bắt đầu viết nội dung bài khảo cứu của bạn...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      if (editor && !editor.isDestroyed) {
        onChange(editor.getHTML());
      }
    },
    immediatelyRender: false,
  });
  
  useImperativeHandle(ref, () => ({
    insertFootnote: (num: number) => {
      if (editor) {
        editor.chain().focus().insertContent(`<sup>[${num}]</sup>`).run();
      }
    }
  }));

  return (
    <div className="rich-editor-container">
      <MenuBar editor={editor} onAddFootnote={onAddFootnote} />
      <EditorContent editor={editor} className="tiptap-editor" />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
