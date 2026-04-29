'use client';

import { useState, useEffect } from 'react';

export default function FontSizeControl() {
  const [size, setSize] = useState(110); // Percent

  useEffect(() => {
    const content = document.querySelector('.article-content') as HTMLElement;
    if (content) {
      content.style.fontSize = `${size / 100}rem`;
    }
  }, [size]);

  return (
    <div className="font-size-control">
      <button onClick={() => setSize(Math.max(80, size - 10))} title="Giảm cỡ chữ">A-</button>
      <span>{size}%</span>
      <button onClick={() => setSize(Math.min(150, size + 10))} title="Tăng cỡ chữ">A+</button>
    </div>
  );
}
