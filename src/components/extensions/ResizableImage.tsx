import { NodeViewWrapper, NodeViewRendererProps, ReactNodeViewRenderer } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const ImageNodeView = (props: NodeViewRendererProps | any) => {
  const { node, updateAttributes, selected } = props;
  const imageRef = useRef<HTMLImageElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [resizing, setResizing] = useState(false);
  const [width, setWidth] = useState(node.attrs.width || '100%');
  const [caption, setCaption] = useState(node.attrs.caption || '');

  useEffect(() => {
    if (!resizing) {
      setCaption(node.attrs.caption || '');
      setWidth(node.attrs.width || '100%');
    }
  }, [node.attrs.caption, node.attrs.width, resizing]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startWidth = imageRef.current?.clientWidth || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const newWidth = startWidth + (currentX - startX);
      const containerWidth = imageRef.current?.parentElement?.clientWidth || 1000;
      const finalWidth = Math.min(Math.max(100, newWidth), containerWidth);
      const percentWidth = (finalWidth / containerWidth) * 100;
      setWidth(`${percentWidth}%`);
    };

    const onMouseUp = () => {
      setResizing(false);
      const finalPercent = `${(imageRef.current?.clientWidth || 0) / (imageRef.current?.parentElement?.clientWidth || 1) * 100}%`;
      updateAttributes({ width: finalPercent });
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [updateAttributes]);

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCaption(val);
    updateAttributes({ caption: val });
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [caption]);

  return (
    <NodeViewWrapper 
      className={`resizable-image-parent ${node.attrs.className || ''}`} 
      style={{ textAlign: node.attrs.textAlign || 'center', display: 'block', margin: '2.5rem 0' }}
    >
      <div 
        className={`resizable-image-wrapper ${selected ? 'is-selected' : ''}`} 
        style={{ 
          width: width, 
          display: 'inline-block', 
          position: 'relative',
          padding: '4px',
          border: selected ? '2px solid #a0783a' : '2px solid transparent',
          borderRadius: '6px'
        }}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          title={node.attrs.title}
          draggable="false"
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
        />
        {selected && (
          <div 
            className="resize-handle"
            onMouseDown={onMouseDown}
            style={{
              position: 'absolute',
              right: '-7px',
              bottom: '-7px',
              width: '16px',
              height: '16px',
              background: '#a0783a',
              border: '2px solid #fff',
              borderRadius: '50%',
              cursor: 'nwse-resize',
              zIndex: 10
            }}
          />
        )}
        <textarea
          ref={textareaRef}
          className="image-caption-input"
          placeholder="Nhập chú thích bài khảo cứu..."
          value={caption}
          onChange={handleCaptionChange}
          rows={1}
          style={{ 
            width: '100%', 
            textAlign: 'center',
            marginTop: '12px',
            display: 'block',
            resize: 'none',
            overflow: 'hidden',
            minHeight: '1.2em',
            padding: '8px 0',
            borderTop: '1px solid #e8dcc8',
            fontFamily: 'serif',
            fontStyle: 'italic',
            fontSize: '16px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#2c1a0e'
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};

export const ResizableImage = Image.extend({
  name: 'image',
  priority: 2500, // Even higher priority

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: {
        default: '100%',
        parseHTML: element => element.getAttribute('data-width') || '100%',
        renderHTML: attributes => ({ 'data-width': attributes.width }),
      },
      textAlign: {
        default: 'center',
        parseHTML: element => element.style.textAlign || 'center',
        renderHTML: attributes => ({ style: `text-align: ${attributes.textAlign}` }),
      },
      caption: {
        default: '',
        parseHTML: element => element.getAttribute('data-caption') || '',
        renderHTML: attributes => ({ 'data-caption': attributes.caption }),
      },
      className: {
        default: '',
        parseHTML: element => element.getAttribute('class')?.replace('resizable-image-parent', '').trim() || '',
        renderHTML: attributes => ({ class: attributes.className }),
      }
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  renderHTML({ HTMLAttributes }) {
    const { textAlign, src, alt, title } = HTMLAttributes;
    const captionText = HTMLAttributes['data-caption'];
    const widthVal = HTMLAttributes['data-width'] || '100%';
    const customClass = HTMLAttributes['class'] || '';
    
    // Explicitly check for content to prevent empty renders
    const captionTag = captionText ? ['div', { 
      class: 'image-caption', 
      style: 'font-family: serif; font-style: italic; font-size: 16px; color: #2c1a0e; margin-top: 10px; padding-top: 10px; border-top: 2px solid #a0783a; text-align: center; display: block; width: 100%;' 
    }, captionText] : ['span', { style: 'display:none' }];

    return [
      'div',
      {
        class: `resizable-image-parent ${customClass}`,
        style: `text-align: ${textAlign || 'center'}; display: block; margin: 3rem 0; width: 100%;`,
        'data-caption': captionText || '',
        'data-width': widthVal,
      },
      ['div', { 
        class: 'resizable-image-content', 
        style: `width: ${widthVal}; display: inline-block;` 
      },
        ['img', { src, alt, title, style: 'width: 100%; height: auto; display: block; border-radius: 4px;' }],
        captionTag
      ]
    ];
  },

  parseHTML() {
    return [
      {
        tag: 'div.resizable-image-parent',
        getAttrs: dom => {
          const container = dom as HTMLElement;
          const img = container.querySelector('img');
          return {
            src: img?.getAttribute('src'),
            alt: img?.getAttribute('alt'),
            title: img?.getAttribute('title'),
            width: container.getAttribute('data-width') || '100%',
            textAlign: container.style.textAlign || 'center',
            caption: container.getAttribute('data-caption') || '',
            className: container.getAttribute('class')?.replace('resizable-image-parent', '').trim() || '',
          };
        },
      },
      {
        tag: 'img[src]',
        priority: 50,
      },
    ];
  },
});
