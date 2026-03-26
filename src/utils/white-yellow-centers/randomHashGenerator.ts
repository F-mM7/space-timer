/**
 * ランダムハッシュ生成ユーティリティ
 */

import { CenterType, UnfoldedView } from './hashToUnfoldedView';
import { unfoldedViewToHash } from './unfoldedViewToHash';

/**
 * ランダムな白黄センター配置を生成
 * @returns ランダムなハッシュ値
 */
export function generateRandomHash(): number {
  const centers: CenterType[] = new Array(24).fill('-');

  // 利用可能な位置のインデックス配列
  const availablePositions = Array.from({ length: 24 }, (_, i) => i);

  // Fisher-Yatesシャッフル
  for (let i = availablePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
  }

  // 最初の4個を白センターに割り当て
  for (let i = 0; i < 4; i++) {
    centers[availablePositions[i]] = 'W';
  }

  // 次の4個を黄センターに割り当て
  for (let i = 4; i < 8; i++) {
    centers[availablePositions[i]] = 'Y';
  }

  // 残りは'-'のまま

  const view: UnfoldedView = { centers };
  return unfoldedViewToHash(view);
}

/**
 * 複数のランダムハッシュを生成
 * @param count 生成する個数
 * @returns ハッシュ値の配列
 */
export function generateRandomHashes(count: number): number[] {
  const hashes: number[] = [];
  const uniqueHashes = new Set<number>();

  while (uniqueHashes.size < count) {
    const hash = generateRandomHash();
    if (!uniqueHashes.has(hash)) {
      uniqueHashes.add(hash);
      hashes.push(hash);
    }
  }

  return hashes;
}

/**
 * 特定の面を固定してランダムハッシュを生成
 * @param fixedPositions 固定する位置と値のマップ
 * @returns ランダムなハッシュ値
 */
export function generateRandomHashWithFixed(
  fixedPositions: Map<number, CenterType>
): number {
  const centers: CenterType[] = new Array(24).fill('-');

  // 固定位置を設定
  let fixedWhiteCount = 0;
  let fixedYellowCount = 0;

  for (const [pos, type] of fixedPositions) {
    if (pos < 0 || pos >= 24) {
      throw new Error(`Invalid position: ${pos}`);
    }
    centers[pos] = type;
    if (type === 'W') fixedWhiteCount++;
    else if (type === 'Y') fixedYellowCount++;
  }

  // 残りの白黄センターを配置
  const remainingWhite = 4 - fixedWhiteCount;
  const remainingYellow = 4 - fixedYellowCount;

  if (remainingWhite < 0 || remainingYellow < 0) {
    throw new Error('Too many fixed centers of the same color');
  }

  // 利用可能な位置を収集
  const availablePositions: number[] = [];
  for (let i = 0; i < 24; i++) {
    if (!fixedPositions.has(i)) {
      availablePositions.push(i);
    }
  }

  // シャッフル
  for (let i = availablePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
  }

  // 残りの白センターを配置
  for (let i = 0; i < remainingWhite; i++) {
    centers[availablePositions[i]] = 'W';
  }

  // 残りの黄センターを配置
  for (let i = remainingWhite; i < remainingWhite + remainingYellow; i++) {
    centers[availablePositions[i]] = 'Y';
  }

  const view: UnfoldedView = { centers };
  return unfoldedViewToHash(view);
}

/**
 * ゴール状態（白が上面、黄が下面）のハッシュを生成
 * @returns ゴール状態のハッシュ値
 */
export function generateGoalHash(): number {
  const centers: CenterType[] = new Array(24).fill('-');

  // U面（インデックス0-3）に白を配置
  for (let i = 0; i < 4; i++) {
    centers[i] = 'W';
  }

  // D面（インデックス20-23）に黄を配置
  for (let i = 20; i < 24; i++) {
    centers[i] = 'Y';
  }

  const view: UnfoldedView = { centers };
  return unfoldedViewToHash(view);
}