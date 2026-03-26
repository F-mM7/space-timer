/**
 * SolutionCheckUI - 解確認のUIコンポーネント
 *
 * UDセンター（白黄センター）の状態遷移ソルバーで最短解を全通り表示する。
 * 24通り回転許可、Lw/Dw/Bw禁止の固定設定で探索を行う。
 */

import React, { useState } from 'react';
import { UDCenterSolver, UDCenterSolverOutput } from '../solvers/white-yellow-centers/UDCenterSolver';
import { hashToUnfoldedView, CenterType } from '../utils/white-yellow-centers/hashToUnfoldedView';
import { hashToHexString } from '../utils/white-yellow-centers/unfoldedViewToHash';
import { completeHashTables } from '../solvers/white-yellow-centers/completeHashTables';
import { generateRandomHash } from '../utils/white-yellow-centers/randomHashGenerator';
import { useScreenSize, ScreenSize } from '../hooks/useScreenSize';
import { computeMinimalHash } from '../utils/white-yellow-centers/minimalHashCalculator';

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
 * グループ化された解の情報
 */
interface SolutionGroup {
  /** グループのキー（minimalHash列のJSON文字列） */
  sequenceKey: string;
  /** このグループに属する解のインデックス */
  solutionIndices: number[];
}

/**
 * UIの状態管理インターフェース
 */
interface SolutionCheckUIState {
  initialHash: string;      // 16進数文字列
  goalHash: string;         // 16進数文字列
  maxOptimalSolutions: number; // 全最短解の最大数
  solution: string[] | null;
  isSearching: boolean;
  error: string | null;
  solutionSteps: SolutionStep[] | null;
  // 全最短解モード用
  allSolutions: string[][] | null;
  allSolutionSteps: SolutionStep[][] | null;
  selectedSolutionIndex: number;
  searchTime: number | null;
  moveCount: number | null;
  // グループ化用
  solutionGroups: SolutionGroup[] | null;
}

export const SolutionCheckUI: React.FC = () => {
  const [state, setState] = useState<SolutionCheckUIState>({
    initialHash: '',
    goalHash: '',
    maxOptimalSolutions: 256, // デフォルト256個
    solution: null,
    isSearching: false,
    error: null,
    solutionSteps: null,
    allSolutions: null,
    allSolutionSteps: null,
    selectedSolutionIndex: 0,
    searchTime: null,
    moveCount: null,
    solutionGroups: null
  });

  /**
   * 結果をクリアするヘルパー
   */
  const clearResults = () => ({
    solution: null,
    solutionSteps: null,
    error: null,
    allSolutions: null,
    allSolutionSteps: null,
    selectedSolutionIndex: 0,
    searchTime: null,
    moveCount: null,
    solutionGroups: null
  });

  /**
   * SolutionStepsからminimalHash列を計算
   */
  const computeMinimalHashSequence = (steps: SolutionStep[]): number[] => {
    return steps.map(step => computeMinimalHash(step.hash));
  };

  /**
   * minimalHash列が一致する解をグループ化
   */
  const groupSolutionsByMinimalHashSequence = (
    allSolutionSteps: SolutionStep[][]
  ): SolutionGroup[] => {
    const groupMap = new Map<string, number[]>();

    allSolutionSteps.forEach((steps, index) => {
      const sequence = computeMinimalHashSequence(steps);
      const key = JSON.stringify(sequence);
      const existing = groupMap.get(key);
      if (existing) {
        existing.push(index);
      } else {
        groupMap.set(key, [index]);
      }
    });

    const groups: SolutionGroup[] = [];
    groupMap.forEach((solutionIndices, sequenceKey) => {
      groups.push({ sequenceKey, solutionIndices });
    });

    // グループを解番号の最小値でソート
    groups.sort((a, b) => a.solutionIndices[0] - b.solutionIndices[0]);

    return groups;
  };

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
   * 解法を探索（24通り回転、Lw/Dw/Bw禁止、全最短解）
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
      allSolutions: null,
      allSolutionSteps: null,
      selectedSolutionIndex: 0,
      searchTime: null,
      moveCount: null,
      solutionGroups: null
    }));

    try {
      // 固定オプション: 24通り回転、Lw/Dw/Bw禁止、全最短解モード
      const result = await UDCenterSolver.solve(initialHash, goalHash, {
        restrictWideMovesToRwUwFw: true,  // Lw/Dw/Bw禁止
        rotationPrefixMode: 'all-24',     // 24通り回転
        findAllOptimalSolutions: true,    // 全最短解モード
        maxOptimalSolutions: state.maxOptimalSolutions
      });

      if (result) {
        let allSolutions: string[][] | null = null;
        let allSolutionSteps: SolutionStep[][] | null = null;

        if (result.allSolutions) {
          allSolutions = result.allSolutions.solutions;
          allSolutionSteps = result.allSolutions.solutionPaths.map((path, idx) =>
            buildSolutionStepsFromPath(initialHash, path, result.allSolutions!.solutions[idx])
          );
        }

        // 最初の解を表示用に設定
        const firstSolution = allSolutions?.[0] ?? result.solution;
        const firstSteps = allSolutionSteps?.[0] ?? buildSolutionSteps(initialHash, result);

        // グループ化処理
        let solutionGroups: SolutionGroup[] | null = null;
        if (allSolutionSteps) {
          solutionGroups = groupSolutionsByMinimalHashSequence(allSolutionSteps);
        }

        setState(prev => ({
          ...prev,
          isSearching: false,
          solution: firstSolution,
          solutionSteps: firstSteps,
          allSolutions,
          allSolutionSteps,
          selectedSolutionIndex: 0,
          searchTime: result.searchTime,
          moveCount: result.moveCount,
          solutionGroups
        }));
      } else {
        setState(prev => ({
          ...prev,
          isSearching: false,
          error: '解が見つかりませんでした'
        }));
      }
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
   * solutionPathから解法ステップを構築（全最短解モード用）
   */
  const buildSolutionStepsFromPath = (_initialHash: number, solutionPath: number[], solution: string[]): SolutionStep[] => {
    const steps: SolutionStep[] = [];
    // 回転プレフィックス判定
    const rotationPattern = /^[xyz]2?'?$/;
    const hasRotationPrefix = solution[0] &&
      rotationPattern.test(solution[0].split(' ')[0]);

    for (let i = 0; i < solutionPath.length; i++) {
      const hash = solutionPath[i];
      const view = hashToUnfoldedView(hash);

      let move: string | null;
      if (i === 0) {
        move = null;
      } else if (hasRotationPrefix && i === 1) {
        move = solution[0];
      } else {
        const solutionIndex = hasRotationPrefix ? i - 1 : i - 1;
        move = solutionIndex >= 0 && solutionIndex < solution.length
          ? solution[solutionIndex]
          : null;
      }

      steps.push({
        stepNumber: i,
        move,
        hash,
        state: view.centers
      });
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
          groupGridColumns: 'repeat(4, 1fr)',
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
          groupGridColumns: 'repeat(3, 1fr)',
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
          groupGridColumns: 'repeat(2, 1fr)',
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
          groupGridColumns: '1fr',
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
    <div className="solution-check-ui" style={{
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

        {/* 最大解数設定 */}
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '12px', color: '#ccc' }}>最大解数:</span>
          <input
            type="number"
            min="1"
            max="1000"
            value={state.maxOptimalSolutions}
            onChange={(e) => {
              const value = Math.max(1, Math.min(1000, parseInt(e.target.value) || 1));
              setState(prev => ({ ...prev, maxOptimalSolutions: value, ...clearResults() }));
            }}
            disabled={state.isSearching}
            style={{
              width: '70px',
              padding: '4px 6px',
              fontSize: '12px',
              fontFamily: 'monospace',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: '#ffffff',
              textAlign: 'center',
              cursor: state.isSearching ? 'not-allowed' : 'text'
            }}
          />
          <span style={{ fontSize: '11px', color: '#888' }}>（24通り回転、Lw/Dw/Bw禁止で探索）</span>
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
          {state.isSearching ? '探索中...' : '最短解を探索'}
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

        {/* 探索結果サマリー */}
        {state.searchTime !== null && state.moveCount !== null && (
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#9ca3af'
          }}>
            {state.moveCount}手 / {state.searchTime}ms
            {state.allSolutions && ` / ${state.allSolutions.length}個の最短解`}
          </div>
        )}

        {/* グループ化された解の選択UI */}
        {state.solutionGroups && state.solutionGroups.length > 0 && state.allSolutions && state.allSolutions.length > 1 && (
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '4px'
          }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>
              解を選択（{state.solutionGroups.length}グループ / {state.allSolutions.length}解）:
            </div>

            {/* グリッドレイアウトでグループを配置 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: responsiveStyles.groupGridColumns,
              gap: '8px',
            }}>
              {state.solutionGroups.map((group, groupIdx) => (
                <div
                  key={group.sequenceKey}
                  style={{
                    padding: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* グループヘッダー（コンパクト化） */}
                  <div style={{
                    marginBottom: '6px',
                    fontSize: '12px',
                    color: '#888',
                  }}>
                    G{groupIdx + 1}（{group.solutionIndices.length}解）
                  </div>

                  {/* グループ内の解ボタン */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {group.solutionIndices.map(idx => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (state.allSolutions && state.allSolutionSteps) {
                            setState(prev => ({
                              ...prev,
                              selectedSolutionIndex: idx,
                              solution: state.allSolutions![idx],
                              solutionSteps: state.allSolutionSteps![idx]
                            }));
                          }
                        }}
                        style={{
                          padding: '4px 0',
                          minWidth: '32px',
                          fontSize: '12px',
                          backgroundColor: state.selectedSolutionIndex === idx ? '#667eea' : 'rgba(0, 0, 0, 0.3)',
                          color: state.selectedSolutionIndex === idx ? 'white' : '#ccc',
                          border: state.selectedSolutionIndex === idx ? '2px solid #667eea' : '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'center'
                        }}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
