import React, { useEffect, useRef, useState } from 'react';
import { TwistyPlayer } from 'cubing/twisty';
import { Alg } from 'cubing/alg';

interface CubeVisualizationForSolverProps {
  scramble?: string;
  solution?: string;
  orientation?: string;
  autoPlay?: boolean;
}

export const CubeVisualizationForSolver: React.FC<CubeVisualizationForSolverProps> = ({
  scramble = '',
  solution = '',
  orientation = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<TwistyPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const indexerRef = useRef<any>(null);

  // 全体のアルゴリズムを配列として管理
  const getAllMoves = () => {
    const moves: string[] = [];
    if (scramble) moves.push(...scramble.split(' ').filter(m => m));
    if (orientation) moves.push(...orientation.split(' ').filter(m => m));
    if (solution) moves.push(...solution.split(' ').filter(m => m));
    return moves;
  };

  const allMoves = getAllMoves();
  const scrambleMoveCount = getScrambleMoveCount();

  // スクランブルの手数を取得
  function getScrambleMoveCount() {
    const scrambleMoves = scramble ? scramble.split(' ').filter(m => m).length : 0;
    const orientationMoves = orientation ? orientation.split(' ').filter(m => m).length : 0;
    return scrambleMoves + orientationMoves;
  }

  // 指定されたインデックスまでの状態をプレイヤーに設定（新実装）
  const setPlayerToIndex = async (index: number) => {
    if (!playerRef.current) return;

    if (index < 0) index = 0;
    if (index > allMoves.length) index = allMoves.length;

    try {
      // indexerが未取得の場合は取得
      if (!indexerRef.current) {
        const model = playerRef.current.experimentalModel as any;
        indexerRef.current = await model.indexer.get();
      }

      if (!indexerRef.current) {
        console.error('Indexer not available');
        return;
      }

      // indexからtimestampを計算
      const targetTimestamp = indexerRef.current.indexToMoveStartTimestamp(index);

      // timestampRequestを使用して状態を更新
      const model = playerRef.current.experimentalModel as any;
      model.timestampRequest.set(targetTimestamp);

      setCurrentMoveIndex(index);
    } catch (error) {
      console.error('Error in setPlayerToIndex:', error);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // TwistyPlayerを作成
    const player = new TwistyPlayer({
      puzzle: '4x4x4',
      alg: new Alg(''),  // 初期は空
      visualization: '3D',
      controlPanel: 'none',
      background: 'none',
      hintFacelets: 'none',
      experimentalSetupAlg: new Alg(''),
      experimentalSetupAnchor: 'start',
      tempoScale: 2.5,
    });

    // スタイル設定
    player.style.width = '100%';
    player.style.height = '350px';

    // コンテナに追加
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(player);

    playerRef.current = player;

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      indexerRef.current = null;
    };
  }, []);

  // 全体のアルゴリズムを設定し、初期位置に移動
  useEffect(() => {
    const initializePlayer = async () => {
      if (!playerRef.current || allMoves.length === 0) return;

      // 全体のアルゴリズムを一度だけ設定
      const fullAlg = allMoves.join(' ');
      playerRef.current.experimentalSetupAlg = new Alg('');
      playerRef.current.alg = new Alg(fullAlg);

      // indexerをリセット
      indexerRef.current = null;

      // 少し待ってからindexerを取得し、初期位置に移動
      setTimeout(async () => {
        if (playerRef.current) {
          try {
            const model = playerRef.current.experimentalModel as any;
            indexerRef.current = await model.indexer.get();

            if (indexerRef.current) {
              // スクランブル後の位置（解法開始前）に設定
              await setPlayerToIndex(scrambleMoveCount);
            }
          } catch (error) {
            console.error('Error initializing player:', error);
          }
        }
      }, 100);
    };

    initializePlayer();
  }, [scramble, orientation, solution]);

  // 解法を再生
  const playSolution = async () => {
    if (!playerRef.current || !solution || !indexerRef.current) return;

    setIsPlaying(true);

    try {
      // 解法開始位置に移動
      const startTimestamp = indexerRef.current.indexToMoveStartTimestamp(scrambleMoveCount);
      const model = playerRef.current.experimentalModel as any;
      model.timestampRequest.set(startTimestamp);

      // 再生開始
      playerRef.current.play();

      // アニメーション時間を計算
      const solutionMoves = solution.split(' ').filter(m => m);
      const animationTime = Math.max(solutionMoves.length * 400, 1000);

      setTimeout(() => {
        setIsPlaying(false);
        setCurrentMoveIndex(allMoves.length);
      }, animationTime);
    } catch (error) {
      console.error('Error playing solution:', error);
      setIsPlaying(false);
    }
  };

  // リセット（スクランブル後、解法開始前の状態）
  const reset = () => {
    setPlayerToIndex(scrambleMoveCount);
  };

  // 解法の最終状態（解けた状態）を表示
  const showSolvedState = () => {
    setPlayerToIndex(allMoves.length);
  };

  // 1手進む
  const stepForward = () => {
    if (isPlaying) return;
    const nextIndex = Math.min(currentMoveIndex + 1, allMoves.length);
    setPlayerToIndex(nextIndex);
  };

  // 1手戻る
  const stepBackward = () => {
    if (isPlaying) return;
    const prevIndex = Math.max(currentMoveIndex - 1, scrambleMoveCount);
    setPlayerToIndex(prevIndex);
  };

  // 解法の手を配列で取得
  const solutionMoves = solution ? solution.split(' ').filter(m => m) : [];
  // 現在の解法内インデックス（0始まり、-1は解法開始前）
  const currentSolutionIndex = currentMoveIndex - scrambleMoveCount - 1;

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* 解法表示（ハイライト付き） */}
      {solution && (
        <div style={{
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          padding: '0.75rem',
          borderRadius: '0.25rem',
          marginBottom: '0.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem'
        }}>
          {solutionMoves.map((move, index) => (
            <span
              key={index}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                backgroundColor: index === currentSolutionIndex
                  ? '#667eea'
                  : index < currentSolutionIndex
                  ? 'rgba(74, 222, 128, 0.3)'
                  : 'transparent',
                color: index === currentSolutionIndex
                  ? '#ffffff'
                  : index < currentSolutionIndex
                  ? '#4ade80'
                  : '#999',
                fontWeight: index === currentSolutionIndex ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {move}
            </span>
          ))}
        </div>
      )}

      {/* キューブ表示エリア */}
      <div
        ref={containerRef}
        className="wy-viz-container"
      />

      {/* コントロールボタン */}
      <div className="wy-viz-controls">
        <button
          onClick={reset}
          disabled={isPlaying}
          className="wy-viz-btn wy-viz-btn-reset"
          title="リセット"
        >
          ↺
        </button>

        {solution && (
          <>
            <button
              onClick={playSolution}
              disabled={isPlaying}
              className="wy-viz-btn wy-viz-btn-play"
              title="解法再生"
            >
              ▶
            </button>

            <button
              onClick={showSolvedState}
              disabled={isPlaying}
              className="wy-viz-btn wy-viz-btn-play"
              title="解けた状態"
            >
              ⏭
            </button>
          </>
        )}

        <button
          onClick={stepBackward}
          disabled={isPlaying || currentMoveIndex <= scrambleMoveCount}
          className="wy-viz-btn wy-viz-btn-solved"
          title="1手戻る"
        >
          ◀
        </button>

        <button
          onClick={stepForward}
          disabled={isPlaying || currentMoveIndex >= allMoves.length}
          className="wy-viz-btn wy-viz-btn-solved"
          title="1手進む"
        >
          ▶
        </button>
      </div>
    </div>
  );
};