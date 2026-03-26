import React, { useEffect, useRef } from 'react';
import { TwistyPlayer } from 'cubing/twisty';
import type { PuzzleType } from '../types/scramble';

interface CubeVisualizationProps {
  scramble: string | null;
  puzzleType: PuzzleType;
  showControls?: boolean;
}

export const CubeVisualization: React.FC<CubeVisualizationProps> = ({
  scramble,
  puzzleType,
  showControls = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<TwistyPlayer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !scramble) return;

    // 既存のプレイヤーをクリーンアップ
    if (playerRef.current) {
      playerRef.current.remove();
    }

    // パズルタイプをTwistyPlayer用にマッピング
    const puzzleMap: { [key: string]: string } = {
      '222': '2x2x2',
      '333': '3x3x3',
      '444': '4x4x4',
      '555': '5x5x5',
      '666': '6x6x6',
      '777': '7x7x7'
    };

    // TwistyPlayerを作成
    const player = new TwistyPlayer({
      puzzle: (puzzleMap[puzzleType] || '3x3x3') as any,
      alg: scramble,
      visualization: '3D',
      background: 'none',
      controlPanel: showControls ? 'bottom-row' : 'none',
      backView: 'top-right',
      hintFacelets: 'none',
      experimentalSetupAlg: '',
      experimentalSetupAnchor: 'start',
      tempoScale: 2
    });

    // プレイヤーのスタイル設定
    player.style.width = '100%';
    player.style.height = '400px';

    // コンテナに追加
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(player);
    playerRef.current = player;

    // クリーンアップ関数
    return () => {
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, [scramble, puzzleType, showControls]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '400px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '24px',
    backdropFilter: 'blur(10px)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.2rem',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '16px',
    textAlign: 'center'
  };

  const placeholderStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '1rem',
    fontStyle: 'italic',
    textAlign: 'center'
  };

  if (!scramble) {
    return (
      <div style={containerStyle}>
        <div style={placeholderStyle}>
          スクランブルを生成すると、キューブの状態が表示されます
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>スクランブル後の状態</div>
      <div ref={containerRef} style={{ width: '100%' }} />
      <div style={{
        marginTop: '12px',
        fontSize: '0.9rem',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center'
      }}>
        マウスでドラッグして回転できます
      </div>
    </div>
  );
};