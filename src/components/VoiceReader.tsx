'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function VoiceReader() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isServerFallback = useRef(false);
  const serverUrls = useRef<string[]>([]);
  const currentUrlIndex = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      audioRef.current = new Audio();
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const getCleanText = () => {
    const content = document.querySelector('.article-content') || document.querySelector('.article-body-container');
    if (!content) return '';
    const clone = content.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style, .article-note, .series-nav-top, .series-nav-bottom, .support-qr-container, .voice-reader-controls').forEach(el => el.remove());
    return clone.innerText || clone.textContent || '';
  };

  const findBestVoice = useCallback(() => {
    if (!synthRef.current) return null;
    const voices = synthRef.current.getVoices();
    
    const naturalVoices = voices.filter(v => 
      v.lang.startsWith('vi') && (v.name.includes('Natural') || v.name.includes('Online'))
    );
    if (naturalVoices.length > 0) return naturalVoices[0];

    const viVoices = voices.filter(v => v.lang.startsWith('vi'));
    if (viVoices.length > 0) return viVoices[0];

    return null;
  }, []);

  const playServerChunk = () => {
    if (!audioRef.current || currentUrlIndex.current >= serverUrls.current.length) {
      setIsPlaying(false);
      return;
    }

    // Wrap the URL with our proxy
    const rawUrl = serverUrls.current[currentUrlIndex.current];
    const proxyUrl = `/api/articles/tts/proxy?url=${encodeURIComponent(rawUrl)}`;
    
    audioRef.current.src = proxyUrl;
    audioRef.current.play().catch(err => {
      console.error('Audio play error:', err);
      setIsPlaying(false);
    });

    audioRef.current.onended = () => {
      currentUrlIndex.current++;
      playServerChunk();
    };
  };

  const speak = async () => {
    if (isPaused) {
      if (isServerFallback.current && audioRef.current) {
        audioRef.current.play();
      } else if (synthRef.current) {
        synthRef.current.resume();
      }
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    stop();
    const text = getCleanText();
    if (!text) return;

    const voice = findBestVoice();
    
    // Check if voice exists and is truly Vietnamese (some browsers return English voices first)
    if (!voice || !voice.lang.startsWith('vi')) {
      isServerFallback.current = true;
      setLoading(true);
      try {
        const res = await fetch('/api/articles/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (data.urls && data.urls.length > 0) {
          serverUrls.current = data.urls;
          currentUrlIndex.current = 0;
          setIsPlaying(true);
          playServerChunk();
        }
      } catch (err) {
        console.error('Server TTS failed', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // NATIVE BROWSER SPEECH
    isServerFallback.current = false;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    synthRef.current?.speak(utterance);
  };

  const pause = () => {
    if (isServerFallback.current && audioRef.current) {
      audioRef.current.pause();
    } else if (synthRef.current) {
      synthRef.current.pause();
    }
    setIsPaused(true);
    setIsPlaying(false);
  };

  const stop = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    serverUrls.current = [];
    currentUrlIndex.current = 0;
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div className="voice-reader-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {loading ? (
        <button className="btn-secondary" disabled style={{ opacity: 0.7, borderRadius: '20px', padding: '6px 16px', fontSize: '0.85rem' }}>
          Đang chuẩn bị...
        </button>
      ) : !isPlaying && !isPaused ? (
        <button 
          onClick={speak} 
          className="btn-secondary" 
          title="Nghe bài viết"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '6px 16px', 
            borderRadius: '20px',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
          Nghe bài viết
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--gold-pale)', padding: '4px 12px', borderRadius: '20px' }}>
          <button 
            onClick={isPlaying ? pause : speak} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', display: 'flex', alignItems: 'center' }}
          >
            {isPlaying ? (
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            ) : (
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            )}
          </button>
          <button 
            onClick={stop} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', display: 'flex', alignItems: 'center' }}
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>
            {isPlaying ? 'Đang đọc...' : 'Tạm dừng'}
          </span>
        </div>
      )}
    </div>
  );
}
