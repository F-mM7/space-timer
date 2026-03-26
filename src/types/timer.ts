// 時間記録の型
export interface TimeRecord {
  id: string;
  duration: number;      // ミリ秒単位
  timestamp: Date;       // 記録日時
}

// タイマー状態の型
export interface TimerState {
  isStandby: boolean;    // スタンバイ状態
  isRunning: boolean;    // 計測中状態
  startTime: number | null;  // 開始時刻
  standbyStartTime: number | null;  // スタンバイ開始時刻
}

// ヒストグラムデータの型
export interface HistogramBin {
  range: string;         // "0-1s", "1-2s", etc.
  count: number;         // 該当件数
  minValue: number;      // 範囲の最小値（ミリ秒）
  maxValue: number;      // 範囲の最大値（ミリ秒）
}

// タイマーの状態表示用
export type TimerStatus = 'idle' | 'standby' | 'running' | 'stopped';