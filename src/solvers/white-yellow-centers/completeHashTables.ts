/**
 * 全45種類の移動に対するハッシュ変換テーブルの生成
 * メモリ効率を考慮して、オンデマンドで計算する方式を採用
 */

import { moveTable, MOVE_NAMES } from './moveTableFixed';

/**
 * ビットマスクに置換を適用
 * perm[i] = 「新しい位置iに来るビットの元位置」
 */
function applyPermutationToBitmask(bitmask: number, perm: Uint8Array): number {
  let result = 0;
  for (let i = 0; i < 24; i++) {
    if ((bitmask >> perm[i]) & 1) {
      result |= 1 << i;
    }
  }
  return result;
}

export class CompleteHashTables {
  // 移動名からインデックスへのマップ
  private moveIndices: Map<string, number> = new Map();

  constructor() {
    // 移動名とインデックスの対応を作成
    MOVE_NAMES.forEach((name, index) => {
      this.moveIndices.set(name, index);
    });
  }

  /**
   * 指定されたハッシュ値に移動を適用して新しいハッシュ値を返す
   * @param hash 元のハッシュ値
   * @param move 移動名
   * @returns 変換後のハッシュ値
   */
  applyMove(hash: number, move: string): number {
    const moveIndex = this.moveIndices.get(move);
    if (moveIndex === undefined) {
      console.warn(`Unknown move: ${move}`);
      return hash;
    }
    return this.applyMoveByIndex(hash, moveIndex);
  }

  /**
   * 指定されたハッシュ値に移動を適用して新しいハッシュ値を返す（高速版）
   * ビットマスク操作で直接ハッシュ値を変換する
   * @param hash 元のハッシュ値
   * @param moveIndex 移動インデックス
   * @returns 変換後のハッシュ値
   */
  applyMoveByIndex(hash: number, moveIndex: number): number {
    const whiteBits = hash & 0xffffff;
    const yellowBits = Math.floor(hash / 0x1000000) & 0xffffff;

    const perm = moveTable.getPermutation(moveIndex);
    const newWhite = applyPermutationToBitmask(whiteBits, perm);
    const newYellow = applyPermutationToBitmask(yellowBits, perm);

    return newWhite + newYellow * 0x1000000;
  }

  /**
   * 全ての有効なハッシュ値を生成（デバッグ用）
   * 注意: 51,482,070個のハッシュ値が生成される
   */
  *generateAllValidHashes(): Generator<number> {
    // 24個の位置から4個を選ぶ組み合わせ（白センター）
    const positions = Array.from({ length: 24 }, (_, i) => i);

    // 白センター4個の位置の組み合わせ
    for (const whitePositions of this.combinations(positions, 4)) {
      const whiteBits = whitePositions.reduce((bits, pos) => bits | (1 << pos), 0);

      // 残りの20個の位置から4個を選ぶ（黄センター）
      const remainingPositions = positions.filter(p => !whitePositions.includes(p));
      for (const yellowPositions of this.combinations(remainingPositions, 4)) {
        const yellowBits = yellowPositions.reduce((bits, pos) => bits | (1 << pos), 0);

        // ハッシュ値を生成
        const hash = whiteBits + (yellowBits * 0x1000000);
        yield hash;
      }
    }
  }

  /**
   * 組み合わせを生成するヘルパー関数
   */
  private *combinations<T>(array: T[], k: number): Generator<T[]> {
    if (k === 0) {
      yield [];
      return;
    }

    if (array.length < k) {
      return;
    }

    const [first, ...rest] = array;

    // firstを含む組み合わせ
    for (const combo of this.combinations(rest, k - 1)) {
      yield [first, ...combo];
    }

    // firstを含まない組み合わせ
    yield* this.combinations(rest, k);
  }
}

// エクスポート用のインスタンス
export const completeHashTables = new CompleteHashTables();