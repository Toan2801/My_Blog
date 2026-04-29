'use client';

import { useState, useRef, useEffect } from 'react';

export default function VoiceReader() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);

  // Cleanup audio when navigating away
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const getCleanText = () => {
    const content = document.querySelector('.article-content');
    if (!content) return '';
    const clone = content.cloneNode(true) as HTMLElement;
    return clone.innerText || clone.textContent || '';
  };

  const playNext = () => {
    if (currentIndexRef.current >= urlsRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setIsLoading(false);
      return;
    }

    const rawUrl = urlsRef.current[currentIndexRef.current];
    const proxyUrl = `/api/articles/tts/proxy?url=${encodeURIComponent(rawUrl)}`;

    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.src = proxyUrl;

    audio.play().then(() => {
      setIsPlaying(true);
      setIsLoading(false);
    }).catch((err) => {
      console.error('Playback failed', err);
      setIsLoading(false);
    });
    
    audio.onended = () => {
      currentIndexRef.current++;
      playNext();
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };
  };

  const speak = async () => {
    if (isPaused && audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    stop();
    setIsLoading(true);

    const text = getCleanText();
    
    try {
      const response = await fetch('/api/articles/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      if (data.urls && data.urls.length > 0) {
        urlsRef.current = data.urls;
        currentIndexRef.current = 0;
        playNext();
      } else {
        throw new Error('No URLs returned');
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsLoading(false);
      alert('Không thể phát giọng đọc lúc này. Vui lòng thử lại.');
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    currentIndexRef.current = 0;
    urlsRef.current = [];
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
  };

  return (
    <div className="voice-reader-controls">
      {isLoading ? (
        <button className="voice-btn loading" disabled>
          <span className="spinner"></span>
          <span>Đang nạp giọng đọc...</span>
        </button>
      ) : !isPlaying && !isPaused ? (
        <button onClick={speak} className="voice-btn play" title="Nghe bài viết">
          <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
          <span>Nghe bài viết</span>
        </button>
      ) : (
        <div className="voice-group">
          <button onClick={isPlaying ? pause : speak} className="voice-btn action">
            {isPlaying ? (
              <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            ) : (
              <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            )}
          </button>
          <button onClick={stop} className="voice-btn stop" title="Dừng hẳn">
            <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
          </button>
          <span className="voice-status">
            {isPlaying ? ' Đang đọc...' : ' Đã tạm dừng'}
          </span>
        </div>
      )}
    </div>
  );
}
