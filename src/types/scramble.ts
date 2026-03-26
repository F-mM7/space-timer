// スクランブル生成器の型定義

export type PuzzleType = '333' | '444' | '555' | '222' | '666' | '777';

export interface PuzzleInfo {
  id: PuzzleType;
  name: string;
  description: string;
}

export interface ScrambleRecord {
  id: string;
  scramble: string;
  puzzleType: PuzzleType;
  timestamp: number;
}

export interface ScrambleState {
  currentScramble: string | null;
  isGenerating: boolean;
  error: string | null;
  puzzleType: PuzzleType;
}

// パズルタイプの定義
export const PUZZLE_TYPES: PuzzleInfo[] = [
  {
    id: '333',
    name: '3x3x3',
    description: '標準的なルービックキューブ'
  },
  {
    id: '222',
    name: '2x2x2',
    description: 'ポケットキューブ'
  },
  {
    id: '444',
    name: '4x4x4',
    description: 'ルービックリベンジ'
  },
  {
    id: '555',
    name: '5x5x5',
    description: 'プロフェッサーキューブ'
  },
  {
    id: '666',
    name: '6x6x6',
    description: 'V-Cube 6'
  },
  {
    id: '777',
    name: '7x7x7',
    description: 'V-Cube 7'
  }
];

// デフォルトのパズルタイプ
export const DEFAULT_PUZZLE_TYPE: PuzzleType = '333';