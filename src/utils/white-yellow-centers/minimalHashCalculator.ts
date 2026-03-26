/**
 * 最小ハッシュ算出ユーティリティ
 *
 * 24通りの回転を適用した中で最小のハッシュ値を算出する
 */

import { CompleteHashTables } from '../../solvers/white-yellow-centers/completeHashTables';

// CompleteHashTablesのインスタンス（回転適用に使用）
const hashTables = new CompleteHashTables();

/**
 * L面オプション（6種類）
 * null = 無回転
 */
const L_FACE_ROTATIONS: Array<string[] | null> = [
  null,
  ['y'],
  ["y'"],
  ['y2'],
  ['z'],
  ["z'"],
];

/**
 * x系回転（4種類）
 * null = 無回転
 */
const X_ROTATIONS: Array<string | null> = [null, 'x', 'x2', "x'"];

/**
 * 24通りの回転パターンを生成
 * L面オプション(6種類) × x系回転(4種類) = 24通り
 */
function generate24RotationPatterns(): Array<string[] | null> {
  const patterns: Array<string[] | null> = [];

  for (const first of L_FACE_ROTATIONS) {
    for (const second of X_ROTATIONS) {
      if (first === null && second === null) {
        // 無回転
        patterns.push(null);
      } else if (first === null) {
        // x系回転のみ
        patterns.push([second!]);
      } else if (second === null) {
        // L面オプションのみ
        patterns.push([...first]);
      } else {
        // y2 x2 は z2 と等価なので、z2 に置き換える
        if (first[0] === 'y2' && second === 'x2') {
          patterns.push(['z2']);
        } else {
          patterns.push([...first, second]);
        }
      }
    }
  }

  return patterns;
}

// 24通りの回転パターン（事前生成）
const ALL_24_ROTATION_PATTERNS = generate24RotationPatterns();

/**
 * ハッシュ値に回転パターンを適用
 * @param hash 元のハッシュ値
 * @param rotations 回転パターン（nullの場合は無回転）
 * @returns 回転後のハッシュ値
 */
function applyRotations(hash: number, rotations: string[] | null): number {
  if (rotations === null) {
    return hash;
  }

  let result = hash;
  for (const rotation of rotations) {
    result = hashTables.applyMove(result, rotation);
  }
  return result;
}

/**
 * 24通りの回転を適用した全ハッシュ値を取得
 * @param hash 入力ハッシュ値（48ビット）
 * @returns 24個のハッシュ値の配列
 */
export function computeAll24RotatedHashes(hash: number): number[] {
  return ALL_24_ROTATION_PATTERNS.map((rotations) =>
    applyRotations(hash, rotations)
  );
}

/**
 * 24通りの回転を適用した中で最小のハッシュ値を算出
 * @param hash 入力ハッシュ値（48ビット）
 * @returns 最小ハッシュ値
 */
export function computeMinimalHash(hash: number): number {
  let minHash = hash; // 無回転を初期値とする

  for (const rotations of ALL_24_ROTATION_PATTERNS) {
    const rotatedHash = applyRotations(hash, rotations);
    if (rotatedHash < minHash) {
      minHash = rotatedHash;
    }
  }

  return minHash;
}
