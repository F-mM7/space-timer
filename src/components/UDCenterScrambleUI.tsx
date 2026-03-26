/**
 * UDCenterScrambleUI - UDセンタースクランブラーUIコンポーネント
 *
 * 4x4x4キューブのUDセンター（白黄センター）用のスクランブルと解法を生成する。
 * - スクランブル: U-D初期状態からランダム状態への手順（ワイドムーブ制限あり）
 * - 解法: ランダム状態からL-R終状態への手順（全ムーブ使用可、回転プレフィックス許可）
 */

import React, { useState, useEffect } from 'react';
import { UDCenterSolver, UDCenterSolverOutput } from '../solvers/white-yellow-centers/UDCenterSolver';
import { generateRandomHash } from '../utils/white-yellow-centers/randomHashGenerator';
import { hashToHexString } from '../utils/white-yellow-centers/unfoldedViewToHash';
import { hashToUnfoldedView, CenterType } from '../utils/white-yellow-centers/hashToUnfoldedView';
import { CubeVisualizationForSolver } from './CubeVisualizationForSolver';

// 固定ハッシュ値
const UD_HASH = 0xf0000000000f;  // 白がU面、黄がD面
const LR_HASH = 0x00f0000000f0;  // 白がL面、黄がR面

/**
 * UIの状態管理インターフェース
 */
interface UDCenterScrambleState {
  randomHash: number | null;
  scrambleSolution: UDCenterSolverOutput | null;  // U-D → ランダム
  reconstructSolution: UDCenterSolverOutput | null;  // ランダム → L-R
  isGenerating: boolean;
  error: string | null;
}

export const UDCenterScrambleUI: React.FC = () => {
  const [state, setState] = useState<UDCenterScrambleState>({
    randomHash: null,
    scrambleSolution: null,
    reconstructSolution: null,
    isGenerating: false,
    error: null
  });

  /**
   * スクランブルと解法を生成
   */
  const handleGenerate = async () => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      scrambleSolution: null,
      reconstructSolution: null
    }));

    try {
      // 1. ランダムハッシュ生成
      const hash = generateRandomHash();
      setState(prev => ({ ...prev, randomHash: hash }));

      // 2. スクランブル生成（U-D → ランダムハッシュ）
      const scramble = await UDCenterSolver.solve(
        UD_HASH,
        hash,
        {
          restrictWideMovesToRwUwFw: true,   // ワイドムーブ制限あり
          rotationPrefixMode: 'none'          // 回転プレフィックス禁止
        }
      );

      if (!scramble) {
        throw new Error('スクランブル生成に失敗しました');
      }
      setState(prev => ({ ...prev, scrambleSolution: scramble }));

      // 3. 解法生成（ランダムハッシュ → L-R）
      const solution = await UDCenterSolver.solve(
        hash,
        LR_HASH,
        {
          restrictWideMovesToRwUwFw: true,   // ワイドムーブ制限あり
          rotationPrefixMode: 'all-24'       // 回転プレフィックス許可（24通り）
        }
      );

      if (!solution) {
        throw new Error('解法生成に失敗しました');
      }
      setState(prev => ({
        ...prev,
        reconstructSolution: solution,
        isGenerating: false
      }));

    } catch (err) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: err instanceof Error ? err.message : '不明なエラーが発生しました'
      }));
    }
  };

  // コンポーネントマウント時に自動生成
  useEffect(() => {
    handleGenerate();
  }, []);

  /**
   * センターの色を取得
   */
  const getCenterColor = (type: CenterType): string => {
    switch (type) {
      case 'W': return 'white';
      case 'Y': return 'gold';
      default: return '#ccc';
    }
  };

  /**
   * コンパクトな展開図コンポーネント
   */
  const CompactUnfoldedView: React.FC<{ centers: CenterType[] }> = ({ centers }) => {
    const size = 18;
    const gap = 1;

    const positions = [
      [2, 0], [3, 0], [3, 1], [2, 1],
      [0, 2], [1, 2], [1, 3], [0, 3],
      [2, 2], [3, 2], [3, 3], [2, 3],
      [4, 2], [5, 2], [5, 3], [4, 3],
      [6, 2], [7, 2], [7, 3], [6, 3],
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

  return (
    <div className="ud-center-scramble-ui" style={{
      padding: '20px',
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      color: '#e0e0e0'
    }}>
      {/* 生成ボタン */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <button
          onClick={handleGenerate}
          disabled={state.isGenerating}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            backgroundColor: state.isGenerating ? '#555' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: state.isGenerating ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {state.isGenerating ? '生成中...' : 'スクランブル生成'}
        </button>
      </div>

      {/* エラー表示 */}
      {state.error && (
        <div style={{
          padding: '10px',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          color: '#ff6b6b',
          border: '1px solid rgba(255, 0, 0, 0.3)',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {state.error}
        </div>
      )}

      {/* メインコンテンツ: 左右分割 */}
      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'flex-start'
      }}>
        {/* 左側: ランダム状態、スクランブル、解法 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* ランダムハッシュ表示 */}
          {state.randomHash !== null && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}>
              <h3 style={{ color: '#ffffff', marginBottom: '10px' }}>生成されたランダム状態</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <CompactUnfoldedView centers={hashToUnfoldedView(state.randomHash).centers} />
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  color: '#4ade80',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '8px 12px',
                  borderRadius: '4px'
                }}>
                  {hashToHexString(state.randomHash)}
                </div>
              </div>
            </div>
          )}

          {/* スクランブル解法 */}
          {state.scrambleSolution && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}>
              <h3 style={{ color: '#ffffff', marginBottom: '10px' }}>
                スクランブル（U-D → ランダム）
              </h3>
              <div style={{
                padding: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '16px',
                wordWrap: 'break-word',
                color: '#4ade80',
                marginBottom: '10px'
              }}>
                {state.scrambleSolution.solution.length === 0
                  ? '(手順なし)'
                  : state.scrambleSolution.solution.join(' ')}
              </div>
              <div style={{ fontSize: '14px', color: '#999' }}>
                <span style={{ marginRight: '20px' }}>
                  手数: <strong style={{ color: '#e0e0e0' }}>{state.scrambleSolution.moveCount}</strong>
                </span>
                <span>
                  探索時間: <strong style={{ color: '#e0e0e0' }}>{state.scrambleSolution.searchTime}ms</strong>
                </span>
              </div>
            </div>
          )}

          {/* 解法 */}
          {state.reconstructSolution && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}>
              <h3 style={{ color: '#ffffff', marginBottom: '10px' }}>
                解法（ランダム → L-R）
              </h3>
              <div style={{
                padding: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '16px',
                wordWrap: 'break-word',
                color: '#4ade80',
                marginBottom: '10px'
              }}>
                {state.reconstructSolution.solution.length === 0
                  ? '(手順なし)'
                  : state.reconstructSolution.solution.join(' ')}
              </div>
              <div style={{ fontSize: '14px', color: '#999' }}>
                <span style={{ marginRight: '20px' }}>
                  手数: <strong style={{ color: '#e0e0e0' }}>{state.reconstructSolution.moveCount}</strong>
                </span>
                <span>
                  探索時間: <strong style={{ color: '#e0e0e0' }}>{state.reconstructSolution.searchTime}ms</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 右側: 3Dビジュアライザ */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {state.scrambleSolution && (
            <div style={{
              padding: '15px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}>
              <CubeVisualizationForSolver
                scramble={state.scrambleSolution.solution.join(' ')}
                solution={state.reconstructSolution?.solution.join(' ') || ''}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UDCenterScrambleUI;
