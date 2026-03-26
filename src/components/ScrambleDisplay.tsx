import React, { useState } from 'react';

interface ScrambleDisplayProps {
  scramble: string | null;
  onCopy: () => Promise<boolean>;
  isGenerating: boolean;
}

export const ScrambleDisplay: React.FC<ScrambleDisplayProps> = ({
  scramble,
  onCopy,
  isGenerating
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    const success = await onCopy();
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const containerStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '32px',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  };

  const scrambleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontFamily: 'monospace',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: '1.8',
    wordBreak: 'break-all',
    letterSpacing: '0.05em'
  };

  const placeholderStyle: React.CSSProperties = {
    fontSize: '1.2rem',
    color: 'rgba(255, 255, 255, 0.3)',
    fontStyle: 'italic'
  };

  const copyButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: isCopied ? '#4ade80' : 'rgba(147, 51, 234, 0.2)',
    border: `1px solid ${isCopied ? '#4ade80' : 'rgba(147, 51, 234, 0.5)'}`,
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: 'rgba(255, 255, 255, 0.6)'
  };

  return (
    <div style={containerStyle}>
      {isGenerating ? (
        <div style={loadingStyle}>
          <div className="spinner" />
          <span>スクランブルを生成中...</span>
        </div>
      ) : scramble ? (
        <>
          <div style={scrambleStyle}>{scramble}</div>
          <button
            onClick={handleCopy}
            style={copyButtonStyle}
            onMouseEnter={(e) => {
              if (!isCopied) {
                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCopied) {
                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
              }
            }}
          >
            {isCopied ? 'コピーしました!' : 'コピー'}
          </button>
        </>
      ) : (
        <div style={placeholderStyle}>
          「生成」ボタンをクリックしてスクランブルを生成してください
        </div>
      )}
    </div>
  );
};