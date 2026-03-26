import React, { useState } from 'react';
import { completeHashTables } from '../../../solvers/white-yellow-centers/completeHashTables';
import { hashToUnfoldedView } from '../hashToUnfoldedView';
import { CenterType } from '../hashToUnfoldedView';

interface TransitionStep {
  move: string;
  hash: number;
  centers: CenterType[];
}

/**
 * ハッシュ変換可視化コンポーネント
 */
export const HashTransitionVisualizer: React.FC = () => {
  const [hashInput, setHashInput] = useState<string>('0xF000000F0000');
  const [algInput, setAlgInput] = useState<string>('R U R\' U\' R U2 R\'');
  const [transitions, setTransitions] = useState<TransitionStep[]>([]);
  const [error, setError] = useState<string>('');

  // ハッシュ値の検証
  const validateHashInput = (hash: number): { valid: boolean; error?: string } => {
    const whiteBits = hash & 0xFFFFFF;
    const yellowBits = Math.floor(hash / 0x1000000) & 0xFFFFFF;

    // ビット重複チェック
    if (whiteBits & yellowBits) {
      return { valid: false, error: '同じ位置に白と黄の両方が存在します' };
    }

    // ビット数カウント
    let whiteCount = 0, yellowCount = 0;
    for (let i = 0; i < 24; i++) {
      if ((whiteBits >> i) & 1) whiteCount++;
      if ((yellowBits >> i) & 1) yellowCount++;
    }

    if (whiteCount !== 4 || yellowCount !== 4) {
      return {
        valid: false,
        error: `白${whiteCount}個、黄${yellowCount}個です。各4個である必要があります`
      };
    }

    return { valid: true };
  };

  // 可視化を実行
  const handleVisualize = () => {
    setError('');
    setTransitions([]);

    // ハッシュ値のパース
    let hash: number;
    try {
      const cleanHash = hashInput.trim().toLowerCase().replace(/^0x/, '');
      hash = parseInt(cleanHash, 16);
      if (isNaN(hash) || hash < 0) {
        throw new Error('無効なハッシュ値');
      }
    } catch (e) {
      setError('ハッシュ値の形式が正しくありません。例: 0xF000000F0000');
      return;
    }

    // ハッシュ値の検証
    const validation = validateHashInput(hash);
    if (!validation.valid) {
      setError(validation.error || '無効なハッシュ値');
      return;
    }

    // アルゴリズムのパース
    const moves = algInput.trim() ? algInput.trim().split(/\s+/).filter(m => m) : [];

    // 遷移の計算
    const steps: TransitionStep[] = [];

    // 初期状態
    const initialView = hashToUnfoldedView(hash);
    steps.push({
      move: '初期状態',
      hash: hash,
      centers: initialView.centers
    });

    // 各移動を適用
    let currentHash = hash;
    for (const move of moves) {
      currentHash = completeHashTables.applyMove(currentHash, move);
      const view = hashToUnfoldedView(currentHash);
      steps.push({
        move: move,
        hash: currentHash,
        centers: view.centers
      });
    }

    setTransitions(steps);
  };

  // センターの色を取得
  const getCenterColor = (type: CenterType): string => {
    switch (type) {
      case 'W': return '#FFFFFF';
      case 'Y': return '#FFD700';
      default: return '#4b5563';
    }
  };

  // 展開図コンポーネント（コンパクト版）
  const UnfoldedView: React.FC<{ centers: CenterType[] }> = ({ centers }) => {
    const renderCenter = (index: number) => (
      <div
        style={{
          width: '18px',
          height: '18px',
          backgroundColor: getCenterColor(centers[index]),
          color: centers[index] === 'W' ? '#000' : centers[index] === 'Y' ? '#000' : '#666',
          border: '1px solid #4b5563',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '10px',
          fontFamily: 'monospace'
        }}
      >
        {centers[index] === '-' ? '' : centers[index]}
      </div>
    );

    const renderEmpty = () => (
      <div style={{ width: '18px', height: '18px' }} />
    );

    return (
      <div style={{
        display: 'inline-grid',
        gridTemplateColumns: 'repeat(8, 18px)',
        gridTemplateRows: 'repeat(6, 18px)',
        gap: '1px'
      }}>
        {/* 1行目: U面の上半分 */}
        {renderEmpty()}
        {renderEmpty()}
        {renderCenter(0)}
        {renderCenter(1)}
        {renderEmpty()}
        {renderEmpty()}
        {renderEmpty()}
        {renderEmpty()}

        {/* 2行目: U面の下半分 */}
        {renderEmpty()}
        {renderEmpty()}
        {renderCenter(3)}
        {renderCenter(2)}
        {renderEmpty()}
        {renderEmpty()}
        {renderEmpty()}
        {renderEmpty()}

        {/* 3行目: L, F, R, B面の上半分 */}
        {renderCenter(4)}
        {renderCenter(5)}
        {renderCenter(8)}
        {renderCenter(9)}
        {renderCenter(12)}
        {renderCenter(13)}
        {renderCenter(16)}
        {renderCenter(17)}

        {/* 4行目: L, F, R, B面の下半分 */}
        {renderCenter(7)}
        {renderCenter(6)}
        {renderCenter(11)}
        {renderCenter(10)}
        {renderCenter(15)}
        {renderCenter(14)}
        {renderCenter(19)}
        {renderCenter(18)}

        {/* 5行目: D面の上半分 */}
        {renderEmpty()}
        {renderEmpty()}
        {renderCenter(20)}
        {renderCenter(21)}
        {renderEmpty()}
        {renderEmpty()}
        {renderEmpty()}
        {renderEmpty()}

        {/* 6行目: D面の下半分 */}
        {renderEmpty()}
        {renderEmpty()}
        {renderCenter(23)}
        {renderCenter(22)}
        {renderEmpty()}
        {renderEmpty()}
        {renderEmpty()}
        {renderEmpty()}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#111827', minHeight: '100vh', color: '#e5e7eb' }}>
      <h2 style={{ marginBottom: '20px', color: '#f3f4f6' }}>ハッシュ変換可視化</h2>

      {/* 入力部 */}
      <div style={{
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        border: '1px solid #374151'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#9ca3af' }}>
            ハッシュ値 (16進数):
          </label>
          <input
            type="text"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="例: 0xF000000F0000"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#111827',
              color: '#e5e7eb',
              border: '1px solid #374151',
              borderRadius: '5px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#9ca3af' }}>
            アルゴリズム (スペース区切り):
          </label>
          <input
            type="text"
            value={algInput}
            onChange={(e) => setAlgInput(e.target.value)}
            placeholder="例: R U R' U' R U2 R'"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#111827',
              color: '#e5e7eb',
              border: '1px solid #374151',
              borderRadius: '5px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}
          />
        </div>

        <button
          onClick={handleVisualize}
          style={{
            padding: '10px 30px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          可視化
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div style={{
          padding: '10px 15px',
          backgroundColor: '#991b1b',
          color: '#fee2e2',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* 遷移の表示（横並びのコンパクト版） */}
      {transitions.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '15px',
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          border: '1px solid #374151'
        }}>
          {transitions.map((step, index) => (
            <div
              key={index}
              style={{
                padding: '10px',
                backgroundColor: '#111827',
                borderRadius: '5px',
                border: '1px solid #374151',
                minWidth: '150px'
              }}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: index === 0 ? '#10b981' : '#ef4444',
                marginBottom: '5px',
                textAlign: 'center'
              }}>
                {index === 0 ? '初期' : `${index}. ${step.move}`}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '5px'
              }}>
                <UnfoldedView centers={step.centers} />
              </div>

              <div style={{
                fontSize: '10px',
                color: '#3b82f6',
                fontFamily: 'monospace',
                textAlign: 'center'
              }}>
                {step.hash.toString(16).padStart(12, '0').toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};