import { useState, useCallback, useEffect } from 'react';
import { randomScrambleForEvent } from 'cubing/scramble';
import { v7 as uuidv7 } from 'uuid';
import type { PuzzleType, ScrambleState, ScrambleRecord } from '../types/scramble';
import { DEFAULT_PUZZLE_TYPE } from '../types/scramble';

// LocalStorageのキー
const STORAGE_KEY = 'scramble_history';
const PUZZLE_TYPE_KEY = 'scramble_puzzle_type';
const MAX_HISTORY_SIZE = 100;

// カスタムフック: スクランブル生成機能
export const useScramble = () => {
  const [state, setState] = useState<ScrambleState>({
    currentScramble: null,
    isGenerating: false,
    error: null,
    puzzleType: DEFAULT_PUZZLE_TYPE
  });

  const [history, setHistory] = useState<ScrambleRecord[]>([]);

  // LocalStorageから履歴を読み込む
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }

      const savedPuzzleType = localStorage.getItem(PUZZLE_TYPE_KEY);
      if (savedPuzzleType) {
        setState(prev => ({ ...prev, puzzleType: savedPuzzleType as PuzzleType }));
      }
    } catch (error) {
      console.error('Failed to load history from localStorage:', error);
    }
  }, []);

  // 履歴を保存
  const saveHistory = useCallback((records: ScrambleRecord[]) => {
    try {
      // 最新のMAX_HISTORY_SIZE件のみ保存
      const trimmedHistory = records.slice(0, MAX_HISTORY_SIZE);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
      setHistory(trimmedHistory);
    } catch (error) {
      console.error('Failed to save history to localStorage:', error);
    }
  }, []);

  // スクランブルを生成
  const generateScramble = useCallback(async () => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // cubing.jsを使用してスクランブルを生成
      const scrambleAlg = await randomScrambleForEvent(state.puzzleType);
      const scrambleString = scrambleAlg.toString();

      // 新しいレコードを作成
      const newRecord: ScrambleRecord = {
        id: uuidv7(),
        scramble: scrambleString,
        puzzleType: state.puzzleType,
        timestamp: Date.now()
      };

      // 履歴に追加（最新のものを先頭に）
      const newHistory = [newRecord, ...history];
      saveHistory(newHistory);

      setState(prev => ({
        ...prev,
        currentScramble: scrambleString,
        isGenerating: false
      }));
    } catch (error) {
      console.error('Failed to generate scramble:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'スクランブルの生成に失敗しました'
      }));
    }
  }, [state.puzzleType, history, saveHistory]);

  // パズルタイプを変更
  const setPuzzleType = useCallback((newType: PuzzleType) => {
    localStorage.setItem(PUZZLE_TYPE_KEY, newType);
    setState(prev => ({ ...prev, puzzleType: newType, currentScramble: null }));
  }, []);

  // クリップボードにコピー
  const copyToClipboard = useCallback(async () => {
    if (!state.currentScramble) return false;

    try {
      await navigator.clipboard.writeText(state.currentScramble);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, [state.currentScramble]);

  // 履歴をクリア
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // 履歴からスクランブルを選択
  const selectFromHistory = useCallback((record: ScrambleRecord) => {
    setState(prev => ({
      ...prev,
      currentScramble: record.scramble,
      puzzleType: record.puzzleType
    }));
  }, []);

  return {
    currentScramble: state.currentScramble,
    isGenerating: state.isGenerating,
    error: state.error,
    puzzleType: state.puzzleType,
    history,
    generateScramble,
    setPuzzleType,
    copyToClipboard,
    clearHistory,
    selectFromHistory
  };
};