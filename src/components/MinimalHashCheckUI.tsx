/**
 * MinimalHashCheckUI - 最小ハッシュ確認のUIコンポーネント
 *
 * ランダムなハッシュを生成し、24通りの回転から最小ハッシュを計算して表示する。
 */

import React, { useState } from 'react';
import { hashToUnfoldedView, CenterType } from '../utils/white-yellow-centers/hashToUnfoldedView';
import { hashToHexString } from '../utils/white-yellow-centers/unfoldedViewToHash';
import { generateRandomHash } from '../utils/white-yellow-centers/randomHashGenerator';
import { computeMinimalHash } from '../utils/white-yellow-centers/minimalHashCalculator';
import { useScreenSize, ScreenSize } from '../hooks/useScreenSize';

/**
 * UIの状態管理インターフェース
 */
interface MinimalHashCheckUIState {
  originalHash: number | null;
  minimalHash: number | null;
}

/**
 * センターの色を取得
 */
const getCenterColor = (type: CenterType): string => {
  switch (type) {
    case 'W':
      return 'white';
    case 'Y':
      return 'gold';
    default:
      return '#ccc';
  }
};

/**
 * コンパクトな展開図コンポーネント
 */
const CompactUnfoldedView: React.FC<{ centers: CenterType[]; scale?: number }> = ({ centers, scale = 1 }) => {
  const baseSize = 18;
  const size = Math.round(baseSize * scale);
  const gap = 1;

  // 8x6グリッドでの位置マッピング
  const positions = [
    // U面 (0-3) - 下段は3,2の順
    [2, 0], [3, 0], [3, 1], [2, 1],
    // L面 (4-7) - 下段は7,6の順
    [0, 2], [1, 2], [1, 3], [0, 3],
    // F面 (8-11) - 下段は11,10の順
    [2, 2], [3, 2], [3, 3], [2, 3],
    // R面 (12-15) - 下段は15,14の順
    [4, 2], [5, 2], [5, 3], [4, 3],
    // B面 (16-19) - 下段は19,18の順
    [6, 2], [7, 2], [7, 3], [6, 3],
    // D面 (20-23) - 下段は23,22の順
    [2, 4], [3, 4], [3, 5], [2, 5]
  ];

  return (
    <div style={{
      display: 'inline-block',
      position: 'relative',
      width: 8 * (size + gap),
      height: 6 * (size + gap),
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '4px',
      padding: '2px'
    }}>
      {positions.map((pos, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: pos[0] * (size + gap),
            top: pos[1] * (size + gap),
            width: size,
            height: size,
            backgroundColor: getCenterColor(centers[index]),
            border: '1px solid #333',
            borderRadius: '2px'
          }}
        />
      ))}
    </div>
  );
};

/**
 * レスポンシブスタイルの取得
 */
const getResponsiveStyles = (screenSize: ScreenSize) => {
  switch (screenSize) {
    case 'small':
      return {
        containerPadding: '10px',
        containerWidth: '100%',
        containerMaxWidth: '100%',
        gridColumns: '1fr',
        fontSize: '12px',
        titleFontSize: '16px',
        scale: 1.2,
      };
    case 'mobile':
      return {
        containerPadding: '15px',
        containerWidth: '100%',
        containerMaxWidth: '100%',
        gridColumns: '1fr',
        fontSize: '13px',
        titleFontSize: '18px',
        scale: 1.4,
      };
    case 'tablet':
      return {
        containerPadding: '20px',
        containerWidth: '100%',
        containerMaxWidth: '800px',
        gridColumns: '1fr 1fr',
        fontSize: '14px',
        titleFontSize: '20px',
        scale: 1.5,
      };
    default:
      return {
        containerPadding: '20px',
        containerWidth: '100%',
        containerMaxWidth: '900px',
        gridColumns: '1fr 1fr',
        fontSize: '14px',
        titleFontSize: '22px',
        scale: 1.6,
      };
  }
};

export const MinimalHashCheckUI: React.FC = () => {
  const [state, setState] = useState<MinimalHashCheckUIState>({
    originalHash: null,
    minimalHash: null,
  });

  const screenSize = useScreenSize();
  const responsiveStyles = getResponsiveStyles(screenSize);

  /**
   * ランダムハッシュを生成して最小ハッシュを計算
   */
  const handleGenerate = () => {
    const hash = generateRandomHash();
    const minimal = computeMinimalHash(hash);
    setState({
      originalHash: hash,
      minimalHash: minimal,
    });
  };

  const isMinimal = state.originalHash !== null && state.originalHash === state.minimalHash;

  return (
    <div className="minimal-hash-check-ui" style={{
      padding: responsiveStyles.containerPadding,
      width: responsiveStyles.containerWidth,
      maxWidth: responsiveStyles.containerMaxWidth,
      margin: '0 auto',
      color: '#e0e0e0',
      fontSize: responsiveStyles.fontSize,
    }}>
      {/* タイトル */}
      <h2 style={{
        fontSize: responsiveStyles.titleFontSize,
        marginBottom: '20px',
        textAlign: 'center',
        color: '#fff',
      }}>
        最小ハッシュ確認
      </h2>

      {/* ランダム生成ボタン */}
      <div style={{
        marginBottom: '30px',
        textAlign: 'center',
      }}>
        <button
          onClick={handleGenerate}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            backgroundColor: '#4a90d9',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ランダム生成
        </button>
      </div>

      {/* 結果表示 */}
      {state.originalHash !== null && state.minimalHash !== null && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: responsiveStyles.gridColumns,
          gap: '20px',
        }}>
          {/* 元のハッシュ */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
          }}>
            <h3 style={{
              marginBottom: '15px',
              color: '#b0b0b0',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              元のハッシュ
              {isMinimal && (
                <span style={{
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}>
                  最小
                </span>
              )}
            </h3>
            <div style={{ marginBottom: '15px' }}>
              <CompactUnfoldedView
                centers={hashToUnfoldedView(state.originalHash).centers}
                scale={responsiveStyles.scale}
              />
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#e0e0e0',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '8px 12px',
              borderRadius: '4px',
              display: 'inline-block',
            }}>
              {hashToHexString(state.originalHash)}
            </div>
          </div>

          {/* 最小ハッシュ */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
          }}>
            <h3 style={{
              marginBottom: '15px',
              color: '#b0b0b0',
              fontSize: '14px',
            }}>
              最小ハッシュ
            </h3>
            <div style={{ marginBottom: '15px' }}>
              <CompactUnfoldedView
                centers={hashToUnfoldedView(state.minimalHash).centers}
                scale={responsiveStyles.scale}
              />
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#e0e0e0',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '8px 12px',
              borderRadius: '4px',
              display: 'inline-block',
            }}>
              {hashToHexString(state.minimalHash)}
            </div>
          </div>
        </div>
      )}

      {/* 初期状態のメッセージ */}
      {state.originalHash === null && (
        <div style={{
          textAlign: 'center',
          color: '#888',
          marginTop: '40px',
        }}>
          「ランダム生成」ボタンをクリックして開始してください
        </div>
      )}
    </div>
  );
};
