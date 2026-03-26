/**
 * UDCenterSolverCheckUI - UDセンターソルバー確認のUIコンポーネント
 *
 * UDセンター（白黄センター）の状態遷移ソルバーをテストするためのUI。
 * 始状態と終状態のハッシュ値を入力し、各オプションでの解法を比較できる。
 */

import React, { useState } from 'react';
import { UDCenterSolver, UDCenterSolverOutput, RotationPrefixMode } from '../solvers/white-yellow-centers/UDCenterSolver';
import { hashToUnfoldedView, CenterType } from '../utils/white-yellow-centers/hashToUnfoldedView';
import { hashToHexString } from '../utils/white-yellow-centers/unfoldedViewToHash';
import { completeHashTables } from '../solvers/white-yellow-centers/completeHashTables';
import { generateRandomHash } from '../utils/white-yellow-centers/randomHashGenerator';
import { useScreenSize, ScreenSize } from '../hooks/useScreenSize';

/**
 * 解法ステップの型定義
 */
interface SolutionStep {
  stepNumber: number;
  move: string | null;  // nullは初期状態
  hash: number;
  state: CenterType[];  // センターの状態配列
}

/**
 * 各オプションの探索結果
 */
interface OptionResult {
  moveCount: number;
  searchTime: number;
  solution: string[];
  solutionSteps: SolutionStep[] | null;
}

/**
 * 全オプションの探索結果
 */
type AllResults = {
  [key: string]: OptionResult | null;
} | null;

/**
 * UIの状態管理インターフェース
 */
interface UDCenterSolverCheckUIState {
  initialHash: string;      // 16進数文字列
  goalHash: string;         // 16進数文字列
  restrictWideMovesToRwUwFw: boolean; // ワイドムーブ制限オプション
  rotationPrefixMode: RotationPrefixMode; // 回転プレフィックスモード
  solution: string[] | null;
  isSearching: boolean;
  error: string | null;
  solutionSteps: SolutionStep[] | null;
  allResults: AllResults;
}

export const UDCenterSolverCheckUI: React.FC = () => {
  const [state, setState] = useState<UDCenterSolverCheckUIState>({
    initialHash: '',
    goalHash: '',
    restrictWideMovesToRwUwFw: false, // デフォルトで全36種類を使用
    rotationPrefixMode: 'none', // デフォルトで回転プレフィックスを許可しない
    solution: null,
    isSearching: false,
    error: null,
    solutionSteps: null,
    allResults: null
  });

  /**
   * 結果をクリアするヘルパー
   */
  const clearResults = () => ({
    solution: null,
    solutionSteps: null,
    allResults: null,
    error: null
  });

  /**
   * 始状態をランダム化
   */
  const handleRandomizeInitial = () => {
    const hash = generateRandomHash();
    const hexString = hashToHexString(hash);
    setState(prev => ({ ...prev, initialHash: hexString, ...clearResults() }));
  };

  /**
   * 終状態をランダム化
   */
  const handleRandomizeGoal = () => {
    const hash = generateRandomHash();
    const hexString = hashToHexString(hash);
    setState(prev => ({ ...prev, goalHash: hexString, ...clearResults() }));
  };

  /**
   * 両方をランダム化
   */
  const handleRandomizeBoth = () => {
    const initialHash = generateRandomHash();
    const goalHash = generateRandomHash();
    setState(prev => ({
      ...prev,
      initialHash: hashToHexString(initialHash),
      goalHash: hashToHexString(goalHash),
      ...clearResults()
    }));
  };

  /**
   * ハッシュ値の解析と検証
   */
  const parseHashInput = (input: string): number | null => {
    try {
      // 0xプレフィックスを許可
      const cleanInput = input.trim();
      if (cleanInput === '') return null;

      const hash = cleanInput.startsWith('0x') || cleanInput.startsWith('0X')
        ? parseInt(cleanInput, 16)
        : parseInt('0x' + cleanInput, 16);

      if (isNaN(hash) || hash < 0) {
        return null;
      }

      // ハッシュ値の検証
      if (!UDCenterSolver.validateHash(hash)) {
        return null;
      }

      return hash;
    } catch {
      return null;
    }
  };

  /**
   * 解法を探索（全6パターン並列）
   */
  const handleSearch = async () => {
    // 入力値の解析
    const initialHash = parseHashInput(state.initialHash);
    const goalHash = parseHashInput(state.goalHash);

    if (initialHash === null) {
      setState(prev => ({ ...prev, error: '始状態のハッシュ値が無効です' }));
      return;
    }

    if (goalHash === null) {
      setState(prev => ({ ...prev, error: '終状態のハッシュ値が無効です' }));
      return;
    }

    // 探索開始
    setState(prev => ({
      ...prev,
      isSearching: true,
      error: null,
      solution: null,
      solutionSteps: null,
      allResults: null
    }));

    try {
      // 6パターンのオプション
      const options = [
        { restricted: false, mode: 'none' as const },
        { restricted: false, mode: 'l-face' as const },
        { restricted: false, mode: 'all-24' as const },
        { restricted: true, mode: 'none' as const },
        { restricted: true, mode: 'l-face' as const },
        { restricted: true, mode: 'all-24' as const },
      ];

      // 並列で全パターン探索
      const promises = options.map(opt =>
        UDCenterSolver.solve(initialHash, goalHash, {
          restrictWideMovesToRwUwFw: opt.restricted,
          rotationPrefixMode: opt.mode
        })
      );

      const results = await Promise.all(promises);

      // 結果をマップに格納
      const allResults: AllResults = {};
      options.forEach((opt, index) => {
        const key = `${opt.restricted ? 'restricted' : 'full'}-${opt.mode}`;
        const result = results[index];
        if (result) {
          const optionResult: OptionResult = {
            moveCount: result.moveCount,
            searchTime: result.searchTime,
            solution: result.solution,
            solutionSteps: buildSolutionSteps(initialHash, result)
          };

          allResults[key] = optionResult;
        } else {
          allResults[key] = null;
        }
      });

      // 現在選択中のオプションの結果を表示用に設定
      const currentKey = `${state.restrictWideMovesToRwUwFw ? 'restricted' : 'full'}-${state.rotationPrefixMode}`;
      const currentResult = allResults[currentKey];

      setState(prev => ({
        ...prev,
        isSearching: false,
        solution: currentResult?.solution ?? null,
        solutionSteps: currentResult?.solutionSteps ?? null,
        allResults
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: error instanceof Error ? error.message : '探索中にエラーが発生しました'
      }));
    }
  };

  /**
   * 解法ステップの構築
   */
  const buildSolutionSteps = (initialHash: number, result: UDCenterSolverOutput) => {
    const steps = [];
    // 回転プレフィックス判定: 最初の要素がx, y, z系の回転かどうか
    const rotationPattern = /^[xyz]2?'?$/;
    const hasRotationPrefix = result.solution[0] &&
      rotationPattern.test(result.solution[0].split(' ')[0]);

    // solutionPathがある場合はそれを使用
    if (result.solutionPath) {
      for (let i = 0; i < result.solutionPath.length; i++) {
        const hash = result.solutionPath[i];
        const view = hashToUnfoldedView(hash);

        let move: string | null;
        if (i === 0) {
          move = null;  // 初期状態
        } else if (hasRotationPrefix && i === 1) {
          move = result.solution[0];  // 回転プレフィックス
        } else {
          const solutionIndex = hasRotationPrefix ? i - 1 : i - 1;
          move = solutionIndex >= 0 && solutionIndex < result.solution.length
            ? result.solution[solutionIndex]
            : null;
        }

        steps.push({
          stepNumber: i,
          move,
          hash,
          state: view.centers
        });
      }
    } else {
      // solutionPathがない場合は手動で再構築
      let currentHash = initialHash;
      const view = hashToUnfoldedView(currentHash);
      steps.push({
        stepNumber: 0,
        move: null,
        hash: currentHash,
        state: view.centers
      });

      for (let i = 0; i < result.solution.length; i++) {
        currentHash = completeHashTables.applyMove(currentHash, result.solution[i]);
        const view = hashToUnfoldedView(currentHash);
        steps.push({
          stepNumber: i + 1,
          move: result.solution[i],
          hash: currentHash,
          state: view.centers
        });
      }
    }

    return steps;
  };

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
   * レスポンシブスタイルを取得
   */
  const getResponsiveStyles = (screenSize: ScreenSize) => {
    switch (screenSize) {
      case 'desktop':
        return {
          containerWidth: '800px',
          containerMaxWidth: '800px',
          containerPadding: '20px',
          gridColumns: 'repeat(4, 1fr)',
          unfoldedViewScale: 1,
          stepFontSize: '12px',
          hashFontSize: '10px',
        };
      case 'tablet':
        return {
          containerWidth: '100%',
          containerMaxWidth: '800px',
          containerPadding: '20px',
          gridColumns: 'repeat(4, 1fr)',
          unfoldedViewScale: 0.9,
          stepFontSize: '12px',
          hashFontSize: '10px',
        };
      case 'mobile':
        return {
          containerWidth: '100%',
          containerMaxWidth: '100%',
          containerPadding: '15px',
          gridColumns: 'repeat(2, 1fr)',
          unfoldedViewScale: 0.85,
          stepFontSize: '11px',
          hashFontSize: '9px',
        };
      case 'small':
        return {
          containerWidth: '100%',
          containerMaxWidth: '100%',
          containerPadding: '10px',
          gridColumns: '1fr',
          unfoldedViewScale: 0.75,
          stepFontSize: '10px',
          hashFontSize: '8px',
        };
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

  const screenSize = useScreenSize();
  const responsiveStyles = getResponsiveStyles(screenSize);

  return (
    <div className="ud-center-solver-check-ui" style={{
      padding: responsiveStyles.containerPadding,
      width: responsiveStyles.containerWidth,
      maxWidth: responsiveStyles.containerMaxWidth,
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      color: '#e0e0e0',
      boxSizing: 'border-box'
    }}>
      {/* ハッシュ設定ブロック */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px'
      }}>
        {/* 一括ランダム生成ボタン */}
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={handleRandomizeBoth}
            disabled={state.isSearching}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              backgroundColor: state.isSearching ? '#555' : '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: state.isSearching ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
            title="始状態と終状態を両方ランダム生成"
          >
            始状態・終状態を一括ランダム生成
          </button>
        </div>

        {/* 始状態・終状態入力（横並び） */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '15px'
        }}>
          {/* 始状態 */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              始状態ハッシュ:
            </label>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <input
                type="text"
                value={state.initialHash}
                onChange={(e) => setState(prev => ({ ...prev, initialHash: e.target.value, ...clearResults() }))}
                placeholder="16進数"
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  minWidth: 0
                }}
                disabled={state.isSearching}
              />
              <button
                onClick={handleRandomizeInitial}
                disabled={state.isSearching}
                style={{
                  padding: '6px 8px',
                  fontSize: '11px',
                  backgroundColor: state.isSearching ? '#555' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: state.isSearching ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                RND
              </button>
            </div>
            {/* 始状態の展開図 */}
            {(() => {
              const hash = parseHashInput(state.initialHash);
              if (hash === null) return (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '12px'
                }}>
                  ハッシュを入力
                </div>
              );
              const view = hashToUnfoldedView(hash);
              return (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center'
                }}>
                  <CompactUnfoldedView centers={view.centers} />
                  <div style={{
                    fontSize: '9px',
                    marginTop: '6px',
                    color: '#666',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    {hashToHexString(hash)}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 終状態 */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              終状態ハッシュ:
            </label>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <input
                type="text"
                value={state.goalHash}
                onChange={(e) => setState(prev => ({ ...prev, goalHash: e.target.value, ...clearResults() }))}
                placeholder="16進数"
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  minWidth: 0
                }}
                disabled={state.isSearching}
              />
              <button
                onClick={handleRandomizeGoal}
                disabled={state.isSearching}
                style={{
                  padding: '6px 8px',
                  fontSize: '11px',
                  backgroundColor: state.isSearching ? '#555' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: state.isSearching ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                RND
              </button>
            </div>
            {/* 終状態の展開図 */}
            {(() => {
              const hash = parseHashInput(state.goalHash);
              if (hash === null) return (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '12px'
                }}>
                  ハッシュを入力
                </div>
              );
              const view = hashToUnfoldedView(hash);
              return (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center'
                }}>
                  <CompactUnfoldedView centers={view.centers} />
                  <div style={{
                    fontSize: '9px',
                    marginTop: '6px',
                    color: '#666',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    {hashToHexString(hash)}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={state.isSearching || !state.initialHash || !state.goalHash}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: state.isSearching ? '#555' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: state.isSearching ? 'not-allowed' : 'pointer',
            width: '100%',
            transition: 'background-color 0.3s'
          }}
        >
          {state.isSearching ? '探索中...' : '解法を探索'}
        </button>
      </div>

      {/* オプションブロック */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px'
      }}>
        <div style={{
          marginBottom: '8px',
          padding: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px'
        }}>
          <strong>オプション</strong>
        </div>

        {/* 表形式グリッド (4列: 行見出し + 3オプション) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr 1fr 1fr',
          gap: '4px'
        }}>
          {/* 列見出し行 */}
          <div style={{
            padding: '8px',
            borderRadius: '4px'
          }}>
            {/* 左上隅は空 */}
          </div>
          <div style={{
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#aaa',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            回転なし
          </div>
          <div style={{
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#aaa',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            L面6通り
          </div>
          <div style={{
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#aaa',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            24通り
          </div>

          {/* 行1: 全ワイドムーブ使用 */}
          <div style={{
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#aaa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            全ムーブ
          </div>
          {(['none', 'l-face', 'all-24'] as const).map((mode) => {
            const isSelected = !state.restrictWideMovesToRwUwFw && state.rotationPrefixMode === mode;
            const resultKey = `full-${mode}`;
            const result = state.allResults?.[resultKey];
            let buttonText: React.ReactNode;
            if (result) {
              buttonText = (
                <>
                  <div>{result.moveCount}手</div>
                  <div style={{ fontSize: '9px', color: isSelected ? 'rgba(255,255,255,0.7)' : '#888' }}>
                    {result.searchTime}ms
                  </div>
                </>
              );
            } else if (state.allResults && !result) {
              buttonText = '—';
            } else {
              buttonText = isSelected ? '選択中' : '選択';
            }
            return (
              <button
                key={`full-${mode}`}
                onClick={() => {
                  const newResult = state.allResults?.[resultKey];
                  setState(prev => ({
                    ...prev,
                    restrictWideMovesToRwUwFw: false,
                    rotationPrefixMode: mode,
                    solution: newResult?.solution ?? prev.solution,
                    solutionSteps: newResult?.solutionSteps ?? prev.solutionSteps
                  }));
                }}
                disabled={state.isSearching}
                style={{
                  padding: '10px 8px',
                  fontSize: '12px',
                  backgroundColor: isSelected ? '#667eea' : 'rgba(0, 0, 0, 0.3)',
                  color: isSelected ? 'white' : '#ccc',
                  border: isSelected ? '2px solid #667eea' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  cursor: state.isSearching ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
              >
                {buttonText}
              </button>
            );
          })}

          {/* 行2: ワイドムーブ制限 */}
          <div style={{
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '4px',
            fontSize: '9px',
            color: '#aaa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            Lw,Dw,Bw禁止
          </div>
          {(['none', 'l-face', 'all-24'] as const).map((mode) => {
            const isSelected = state.restrictWideMovesToRwUwFw && state.rotationPrefixMode === mode;
            const resultKey = `restricted-${mode}`;
            const result = state.allResults?.[resultKey];
            let buttonText: React.ReactNode;
            if (result) {
              buttonText = (
                <>
                  <div>{result.moveCount}手</div>
                  <div style={{ fontSize: '9px', color: isSelected ? 'rgba(255,255,255,0.7)' : '#888' }}>
                    {result.searchTime}ms
                  </div>
                </>
              );
            } else if (state.allResults && !result) {
              buttonText = '—';
            } else {
              buttonText = isSelected ? '選択中' : '選択';
            }
            return (
              <button
                key={`restricted-${mode}`}
                onClick={() => {
                  const newResult = state.allResults?.[resultKey];
                  setState(prev => ({
                    ...prev,
                    restrictWideMovesToRwUwFw: true,
                    rotationPrefixMode: mode,
                    solution: newResult?.solution ?? prev.solution,
                    solutionSteps: newResult?.solutionSteps ?? prev.solutionSteps
                  }));
                }}
                disabled={state.isSearching}
                style={{
                  padding: '10px 8px',
                  fontSize: '12px',
                  backgroundColor: isSelected ? '#667eea' : 'rgba(0, 0, 0, 0.3)',
                  color: isSelected ? 'white' : '#ccc',
                  border: isSelected ? '2px solid #667eea' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  cursor: state.isSearching ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
              >
                {buttonText}
              </button>
            );
          })}
        </div>
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

      {/* 解法・ステップ可視化（常に表示） */}
      <div style={{
        padding: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px'
      }}>
        <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>解法・ステップ可視化</h3>

        {/* 未探索時のプレースホルダー */}
        {!state.solution && !state.solutionSteps && (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            探索を実行すると解法が表示されます
          </div>
        )}

        {/* 解法テキスト表示 */}
        {state.solution && (
          <div style={{
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '16px',
            wordWrap: 'break-word',
            color: '#4ade80',
            marginBottom: state.solutionSteps ? '15px' : '0'
          }}>
            {state.solution.length === 0 ? '(既に解けています)' : state.solution.join(' ')}
          </div>
        )}

        {/* ステップグリッド */}
        {state.solutionSteps && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: responsiveStyles.gridColumns,
            gap: '10px'
          }}>
            {state.solutionSteps.map((step, index) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  minWidth: 0
                }}
              >
                <div style={{ fontSize: responsiveStyles.stepFontSize, marginBottom: '5px', color: '#b0b0b0' }}>
                  Step {index}: {step.move || '初期'}
                </div>
                <CompactUnfoldedView centers={step.state} scale={responsiveStyles.unfoldedViewScale} />
                <div style={{
                  fontSize: responsiveStyles.hashFontSize,
                  marginTop: '5px',
                  fontFamily: 'monospace',
                  color: '#666',
                  wordBreak: 'break-all'
                }}>
                  {hashToHexString(step.hash)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
