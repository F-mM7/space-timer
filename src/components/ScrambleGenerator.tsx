import React, { useEffect, useState } from 'react';
import { useScramble } from '../hooks/useScramble';
import { ScrambleDisplay } from './ScrambleDisplay';
import { PuzzleSelector } from './PuzzleSelector';
import { CubeVisualization } from './CubeVisualization';
import type { ScrambleRecord } from '../types/scramble';

export const ScrambleGenerator: React.FC = () => {
  const [showVisualization, setShowVisualization] = useState(true);
  const {
    currentScramble,
    isGenerating,
    error,
    puzzleType,
    history,
    generateScramble,
    setPuzzleType,
    copyToClipboard,
    clearHistory,
    selectFromHistory
  } = useScramble();

  // 初回レンダリング時に自動生成
  useEffect(() => {
    if (!currentScramble && !isGenerating) {
      generateScramble();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 16px'
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '32px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '8px'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: 'rgba(255, 255, 255, 0.6)'
  };

  const mainContentStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '24px'
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minWidth: '150px'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    fontWeight: '400'
  };

  const errorStyle: React.CSSProperties = {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    color: '#ef4444',
    marginBottom: '16px',
    textAlign: 'center'
  };

  const historyContainerStyle: React.CSSProperties = {
    marginTop: '48px',
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const historyHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  };

  const historyTitleStyle: React.CSSProperties = {
    fontSize: '1.3rem',
    color: '#ffffff'
  };

  const historyListStyle: React.CSSProperties = {
    maxHeight: '300px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const historyItemStyle: React.CSSProperties = {
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid transparent'
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>スクランブル生成器</h1>
        <p style={subtitleStyle}>WCA準拠のランダムステートスクランブルを生成</p>
      </header>

      {error && (
        <div style={errorStyle}>
          エラー: {error}
        </div>
      )}

      <div style={mainContentStyle}>
        <PuzzleSelector
          selectedPuzzle={puzzleType}
          onPuzzleChange={setPuzzleType}
        />

        <ScrambleDisplay
          scramble={currentScramble}
          onCopy={copyToClipboard}
          isGenerating={isGenerating}
        />

        <div style={buttonContainerStyle}>
          <button
            onClick={generateScramble}
            disabled={isGenerating}
            style={{
              ...buttonStyle,
              opacity: isGenerating ? 0.6 : 1,
              cursor: isGenerating ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isGenerating ? '生成中...' : '新しく生成'}
          </button>
          <button
            onClick={() => setShowVisualization(!showVisualization)}
            style={secondaryButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            {showVisualization ? '3D表示を隠す' : '3D表示を表示'}
          </button>
        </div>

        {/* キューブの3D視覚化 */}
        {showVisualization && (
          <div style={{ marginTop: '32px' }}>
            <CubeVisualization
              scramble={currentScramble}
              puzzleType={puzzleType}
              showControls={true}
            />
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div style={historyContainerStyle}>
          <div style={historyHeaderStyle}>
            <h2 style={historyTitleStyle}>履歴（最新 {history.length} 件）</h2>
            <button
              onClick={clearHistory}
              style={secondaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              履歴をクリア
            </button>
          </div>
          <div style={historyListStyle}>
            {history.map((record: ScrambleRecord) => (
              <div
                key={record.id}
                style={historyItemStyle}
                onClick={() => selectFromHistory(record)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#9333ea', fontWeight: '600' }}>
                    {PUZZLE_TYPES.find(p => p.id === record.puzzleType)?.name || record.puzzleType}
                  </span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>
                    {formatDate(record.timestamp)}
                  </span>
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {record.scramble}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// PUZZLE_TYPESのインポートも追加
import { PUZZLE_TYPES } from '../types/scramble';