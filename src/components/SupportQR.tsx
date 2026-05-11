'use client';

import { useState } from 'react';

interface Props {
  qrImage?: string | null;
  facebookUrl?: string | null;
}

export default function SupportQR({ qrImage, facebookUrl }: Props) {
  const [isVisible, setIsVisible] = useState(true);

  const finalQrImage = qrImage || '/uploads/qr-1775885889862.png';
  const finalFacebookUrl = facebookUrl || 'https://www.facebook.com';

  if (!isVisible) return null;

  return (
    <div className="support-qr-card" style={{
      padding: 'var(--space-6)',
      marginBottom: 'var(--space-8)',
      border: '1px solid rgba(160, 120, 58, 0.3)',
      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%)',
      backdropFilter: 'blur(10px)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 'var(--space-5)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
      position: 'relative',
      overflow: 'hidden',
      borderLeft: '4px solid var(--gold)'
    }}>
      {/* Decorative background element */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        fontSize: '100px',
        opacity: 0.05,
        color: 'var(--gold)',
        pointerEvents: 'none',
        fontFamily: 'var(--font-serif)'
      }}>☕</div>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 'var(--space-5)',
        maxWidth: '800px',
        zIndex: 1,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <div style={{
          flexShrink: 0,
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          height: '240px'
        }}>
          <img 
            src="/uploads/wibu-full.png" 
            alt="Mascot" 
            style={{ 
              height: '100%', 
              width: 'auto', 
              objectFit: 'contain',
              animation: 'float 3s ease-in-out infinite',
              filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))'
            }} 
          />
        </div>

        <div style={{ maxWidth: '500px', textAlign: 'left' }}>
          <h3 style={{
            margin: '0 0 var(--space-2)',
            color: 'var(--gold)',
            fontFamily: 'var(--font-serif)',
            fontSize: '1.4rem'
          }}>
            Hỡi các bạn độc giả yêu quý!
          </h3>
          <p style={{
            fontSize: '1.05rem',
            lineHeight: '1.7',
            margin: 0,
            color: 'var(--ink-light)',
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic'
          }}>
            Việc viết và dịch bài rất tốn thời gian và công sức. Nếu các bạn đọc thấy hay, xin vui lòng quét mã QR này tặng mình 1 li cafe để mình có động lực thức khuya viết tiếp phục vụ các bạn. Xin chân thành cảm ơn mọi người ạ.
          </p>
          <p style={{
            fontSize: '0.95rem',
            marginTop: 'var(--space-3)',
            color: 'var(--ink-muted)'
          }}>
            Nếu có yêu cầu mình viết hoặc dịch về nội dung gì, hãy nhắn tin cho mình thông qua <a href={finalFacebookUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', fontWeight: '600', textDecoration: 'underline' }}>Facebook</a> cùng 1 (vài) li cafe ạ.
          </p>
        </div>
      </div>

      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        border: '1px solid var(--border-light)',
        zIndex: 1,
        transition: 'transform 0.3s ease'
      }} className="qr-image-wrapper">
        <img
          src={finalQrImage}
          alt="QR Code ủng hộ"
          style={{ width: '220px', height: '220px', display: 'block', borderRadius: '4px' }}
        />
      </div>

      <button
        onClick={() => setIsVisible(false)}
        style={{
          background: 'var(--gold)',
          color: 'white',
          border: 'none',
          padding: '12px 28px',
          borderRadius: '30px',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.9rem',
          fontWeight: '700',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 4px 15px rgba(44, 82, 130, 0.3)',
          zIndex: 1
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(44, 82, 130, 0.4)';
          e.currentTarget.style.filter = 'brightness(1.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(44, 82, 130, 0.3)';
          e.currentTarget.style.filter = 'brightness(1)';
        }}
      >
        Mình đã ủng hộ rồi nhé
      </button>

      <style jsx>{`
        .support-qr-card {
          animation: slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .qr-image-wrapper:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
