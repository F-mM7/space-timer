/**
 * 展開図からハッシュ値への変換ユーティリティ
 */

import { CenterType, UnfoldedView } from './hashToUnfoldedView';

/**
 * 展開図からハッシュ値を生成
 * @param view 展開図
 * @returns ハッシュ値
 */
export function unfoldedViewToHash(view: UnfoldedView): number {
  let whiteBits = 0;
  let yellowBits = 0;

  for (let i = 0; i < 24; i++) {
    if (view.centers[i] === 'W') {
      whiteBits |= (1 << i);
    } else if (view.centers[i] === 'Y') {
      yellowBits |= (1 << i);
    }
  }

  // 48ビットのハッシュを生成（下位24ビット:白、上位24ビット:黄）
  // JavaScriptの数値精度を考慮して、乗算を使用
  return whiteBits + (yellowBits * 0x1000000);
}

/**
 * 展開図配列から直接ハッシュ値を生成
 * @param centers センター配列（24要素）
 * @returns ハッシュ値
 */
export function centersToHash(centers: CenterType[]): number {
  if (centers.length !== 24) {
    throw new Error('Centers array must have exactly 24 elements');
  }

  return unfoldedViewToHash({ centers });
}

/**
 * ハッシュ値を16進数文字列に変換
 * @param hash ハッシュ値
 * @returns 16進数文字列（例: "0x000F000F0000"）
 */
export function hashToHexString(hash: number): string {
  // 12桁の16進数文字列にパディング
  const hex = hash.toString(16).toUpperCase().padStart(12, '0');
  return '0x' + hex;
}

/**
 * センター配列の妥当性をチェック
 * @param centers センター配列
 * @returns 妥当性チェック結果
 */
export function validateCenters(centers: CenterType[]): {
  valid: boolean;
  whiteCount: number;
  yellowCount: number;
  error?: string;
} {
  if (centers.length !== 24) {
    return {
      valid: false,
      whiteCount: 0,
      yellowCount: 0,
      error: `Expected 24 centers, got ${centers.length}`
    };
  }

  let whiteCount = 0;
  let yellowCount = 0;

  for (const center of centers) {
    if (center === 'W') whiteCount++;
    else if (center === 'Y') yellowCount++;
  }

  // 白黄センターは各4個である必要がある
  const valid = whiteCount === 4 && yellowCount === 4;

  return {
    valid,
    whiteCount,
    yellowCount,
    error: valid ? undefined : `Expected 4 white and 4 yellow centers, got ${whiteCount} white and ${yellowCount} yellow`
  };
}

/**
 * 空の展開図を生成
 * @returns 全て'-'で初期化された展開図
 */
export function createEmptyView(): UnfoldedView {
  return {
    centers: new Array(24).fill('-')
  };
}

/**
 * 展開図をクローン
 * @param view 元の展開図
 * @returns クローンされた展開図
 */
export function cloneView(view: UnfoldedView): UnfoldedView {
  return {
    centers: [...view.centers]
  };
}