import { useMemo } from 'react';
import { TimeRecord, HistogramBin } from '../types/timer';

interface UseHistogramReturn {
  bins: HistogramBin[];
  stats: {
    count: number;
    average: number;
    min: number;
    max: number;
    median: number;
    variance: number;
    stdDev: number;
  };
}

// 動的にビンを生成する関数
function generateDynamicBins(records: TimeRecord[]): { min: number; max: number; label: string }[] {
  if (records.length === 0) {
    // デフォルトのビン
    return [
      { min: 0, max: 1000, label: '0-1秒' },
      { min: 1000, max: 2000, label: '1-2秒' },
      { min: 2000, max: 5000, label: '2-5秒' },
      { min: 5000, max: 10000, label: '5-10秒' },
      { min: 10000, max: Infinity, label: '10秒以上' },
    ];
  }

  const durations = records.map(r => r.duration);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const range = maxDuration - minDuration;

  // 目標ビン数（5-10個程度）
  const targetBinCount = Math.min(10, Math.max(5, Math.ceil(Math.sqrt(records.length))));

  // ビンの幅を計算（きれいな数値に丸める）
  let binWidth = range / targetBinCount;

  // ビン幅をきれいな数値に調整
  if (binWidth < 100) {
    binWidth = Math.ceil(binWidth / 10) * 10; // 10ms単位
  } else if (binWidth < 1000) {
    binWidth = Math.ceil(binWidth / 100) * 100; // 100ms単位
  } else if (binWidth < 5000) {
    binWidth = Math.ceil(binWidth / 500) * 500; // 500ms単位
  } else {
    binWidth = Math.ceil(binWidth / 1000) * 1000; // 1秒単位
  }

  // 開始値を調整（きれいな数値から開始）
  let startValue = Math.floor(minDuration / binWidth) * binWidth;

  const bins = [];
  let currentMin = startValue;

  while (currentMin <= maxDuration) {
    const currentMax = currentMin + binWidth;
    const minSeconds = currentMin / 1000;
    const maxSeconds = currentMax / 1000;

    let label;
    if (currentMax > maxDuration && bins.length > 0) {
      // 最後のビン
      label = `${minSeconds.toFixed(1)}秒以上`;
      bins.push({ min: currentMin, max: Infinity, label });
      break;
    } else {
      label = `${minSeconds.toFixed(1)}-${maxSeconds.toFixed(1)}秒`;
      bins.push({ min: currentMin, max: currentMax, label });
    }

    currentMin = currentMax;
  }

  // 少なくとも3つのビンを確保
  if (bins.length < 3) {
    const simpleWidth = range / 3;
    return [
      { min: minDuration, max: minDuration + simpleWidth, label: `${(minDuration/1000).toFixed(1)}-${((minDuration + simpleWidth)/1000).toFixed(1)}秒` },
      { min: minDuration + simpleWidth, max: minDuration + 2 * simpleWidth, label: `${((minDuration + simpleWidth)/1000).toFixed(1)}-${((minDuration + 2 * simpleWidth)/1000).toFixed(1)}秒` },
      { min: minDuration + 2 * simpleWidth, max: Infinity, label: `${((minDuration + 2 * simpleWidth)/1000).toFixed(1)}秒以上` }
    ];
  }

  return bins;
}

export function useHistogram(records: TimeRecord[]): UseHistogramReturn {
  const bins = useMemo(() => {
    // データに基づいてビンを動的に生成
    const binRanges = generateDynamicBins(records);

    // 初期化：すべてのビンをカウント0で作成
    const binsMap = new Map<string, HistogramBin>();
    binRanges.forEach(range => {
      binsMap.set(range.label, {
        range: range.label,
        count: 0,
        minValue: range.min,
        maxValue: range.max,
      });
    });

    // 各記録をビンに振り分け
    records.forEach(record => {
      const duration = record.duration;
      const range = binRanges.find(r => duration >= r.min && duration < r.max);
      if (range) {
        const bin = binsMap.get(range.label);
        if (bin) {
          bin.count++;
        }
      }
    });

    return Array.from(binsMap.values());
  }, [records]);

  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        median: 0,
        variance: 0,
        stdDev: 0,
      };
    }

    const durations = records.map(r => r.duration);
    const sortedDurations = [...durations].sort((a, b) => a - b);

    const count = durations.length;
    const sum = durations.reduce((acc, val) => acc + val, 0);
    const average = sum / count;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    // 中央値の計算
    let median: number;
    if (count % 2 === 0) {
      median = (sortedDurations[count / 2 - 1] + sortedDurations[count / 2]) / 2;
    } else {
      median = sortedDurations[Math.floor(count / 2)];
    }

    // 分散と標準偏差の計算
    const squaredDiffs = durations.map(duration => Math.pow(duration - average, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / count;
    const stdDev = Math.sqrt(variance);

    return {
      count,
      average,
      min,
      max,
      median,
      variance,
      stdDev,
    };
  }, [records]);

  return {
    bins,
    stats,
  };
}

// ミリ秒を秒単位の文字列に変換するヘルパー関数（常に0.001秒単位で表示）
export function formatDuration(ms: number): string {
  const seconds = ms / 1000;
  return `${seconds.toFixed(3)}秒`;
}

// 標準偏差を表示するための関数（単位：秒）
export function formatStdDev(ms: number): string {
  return formatDuration(ms);
}