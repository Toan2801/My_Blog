'use client';

import { useState, useEffect } from 'react';

const TIPS = [
  "Nhấn '+ Bài viết mới' để bắt đầu soạn thảo kiến thức lịch sử nhé!",
  "Bạn có thể nhúng link YouTube trực tiếp trong mục Quản lý Video.",
  "Đừng quên kiểm tra các bài viết nháp trước khi đăng chính thức.",
  "Sử dụng nút 'Sửa' để cập nhật nội dung cho các bài viết cũ.",
  "Nhấn vào logo History Blog để quay lại trang dành cho độc giả."
];

export default function AdminAssistant() {
  const [isVisible, setIsVisible] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000);
    
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % TIPS.length);
        setFade(true);
      }, 500);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={`admin-assistant ${isVisible ? 'visible' : ''}`}>
      <div className={`speech-bubble ${fade ? 'fade-in' : 'fade-out'}`}>
        {TIPS[tipIndex]}
      </div>
      <div className="chibi-cat">
        <svg viewBox="0 0 200 240" className="cat-svg">
          {/* Đuôi - vẫy mạnh hơn */}
          <path d="M140 180 Q180 160 170 210 Q160 230 180 200" fill="none" stroke="#FFB6C1" strokeWidth="8" strokeLinecap="round" className="tail-full" />
          
          {/* Tai */}
          <path d="M60 70 L40 20 L85 50 Z" fill="#FFE4E1" stroke="#FFB6C1" strokeWidth="2" />
          <path d="M140 70 L160 20 L115 50 Z" fill="#FFE4E1" stroke="#FFB6C1" strokeWidth="2" />
          
          {/* Thân */}
          <ellipse cx="100" cy="170" rx="55" ry="50" fill="#FFF" stroke="#FFB6C1" strokeWidth="3" />
          
          {/* Đầu */}
          <circle cx="100" cy="90" r="65" fill="#FFF" stroke="#FFB6C1" strokeWidth="3" />
          
          {/* Mắt to tròn long lanh */}
          <g className="eyes-group">
            <circle cx="75" cy="85" r="10" fill="#333" />
            <circle cx="72" cy="82" r="4" fill="#FFF" /> {/* Điểm sáng mắt */}
            <circle cx="125" cy="85" r="10" fill="#333" />
            <circle cx="122" cy="82" r="4" fill="#FFF" /> {/* Điểm sáng mắt */}
          </g>
          
          {/* Mũi & Miệng */}
          <circle cx="100" cy="100" r="4" fill="#FFB6C1" />
          <path d="M90 110 Q100 120 110 110" fill="none" stroke="#FFB6C1" strokeWidth="2" strokeLinecap="round" />
          
          {/* Râu */}
          <line x1="50" y1="100" x2="20" y2="95" stroke="#FFB6C1" strokeWidth="1" />
          <line x1="50" y1="110" x2="20" y2="115" stroke="#FFB6C1" strokeWidth="1" />
          <line x1="150" y1="100" x2="180" y2="95" stroke="#FFB6C1" strokeWidth="1" />
          <line x1="150" y1="110" x2="180" y2="115" stroke="#FFB6C1" strokeWidth="1" />

          {/* Hai tay/chân trước */}
          <ellipse cx="80" cy="190" rx="12" ry="18" fill="#FFF" stroke="#FFB6C1" strokeWidth="2" />
          <ellipse cx="120" cy="190" rx="12" ry="18" fill="#FFF" stroke="#FFB6C1" strokeWidth="2" />
          
          {/* Hai chân sau */}
          <ellipse cx="60" cy="210" rx="15" ry="10" fill="#FFF" stroke="#FFB6C1" strokeWidth="2" />
          <ellipse cx="140" cy="210" rx="15" ry="10" fill="#FFF" stroke="#FFB6C1" strokeWidth="2" />
        </svg>
      </div>

      <style jsx>{`
        .admin-assistant {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 10000;
          pointer-events: none;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .admin-assistant.visible {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }
        .speech-bubble {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(5px);
          border: 2px solid var(--gold);
          padding: 12px 18px;
          border-radius: 18px;
          font-family: var(--font-ui);
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 15px;
          position: relative;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          max-width: 220px;
          text-align: center;
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .fade-in { opacity: 1; transform: translateY(0); }
        .fade-out { opacity: 0; transform: translateY(-10px); }
        
        .speech-bubble::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 10px 10px 0;
          border-style: solid;
          border-color: var(--gold) transparent transparent;
        }
        
        .chibi-cat {
          width: 130px;
          height: auto;
          filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1));
          animation: idle 4s ease-in-out infinite;
        }
        
        @keyframes idle {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        
        .eyes-group {
          animation: blink-complex 5s infinite;
        }
        @keyframes blink-complex {
          0%, 94%, 98%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.1); }
        }
        
        .tail-full {
          transform-origin: 140px 180px;
          animation: wag-full 2.5s ease-in-out infinite;
        }
        @keyframes wag-full {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(20deg) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
