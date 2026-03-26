/**
 * ハッシュ値から展開図への変換ユーティリティ
 */

export type CenterType = 'W' | 'Y' | '-';

export interface UnfoldedView {
  centers: CenterType[];
}

/**
 * 48ビットのハッシュ値を展開図形式の配列に変換
 * @param hash ハッシュ値（数値）
 * @returns 展開図（24個のセンターの配列）
 */
export function hashToUnfoldedView(hash: number): UnfoldedView {
  const centers: CenterType[] = new Array(24).fill('-');

  // 下位24ビット（白センターの位置）
  const whiteBits = hash & 0xFFFFFF;
  // 上位24ビット（黄センターの位置）
  // JavaScriptの数値精度を考慮して、除算を使用
  const yellowBits = Math.floor(hash / 0x1000000) & 0xFFFFFF;

  for (let i = 0; i < 24; i++) {
    if ((whiteBits >> i) & 1) {
      centers[i] = 'W';
    } else if ((yellowBits >> i) & 1) {
      centers[i] = 'Y';
    }
  }

  return { centers };
}

/**
 * 16進数文字列のハッシュ値を展開図に変換
 * @param hexString 16進数文字列（例: "0x000F000F0000"）
 * @returns 展開図
 */
export function hexStringToUnfoldedView(hexString: string): UnfoldedView {
  // "0x"プレフィックスを除去
  const cleanHex = hexString.toLowerCase().replace(/^0x/, '');

  // 16進数文字列を数値に変換
  const hash = parseInt(cleanHex, 16);

  if (isNaN(hash) || hash < 0 || hash > 0xFFFFFFFFFFFF) {
    throw new Error('Invalid hash value');
  }

  return hashToUnfoldedView(hash);
}

/**
 * 展開図をASCII形式で表示用に整形
 * インデックスマッピング:
 *       0  1       <- U面
 *       3  2
 *  4  5  8  9 12 13 16 17
 *  7  6 11 10 15 14 19 18
 *      20 21       <- D面
 *      23 22
 * @param view 展開図
 * @returns ASCII形式の文字列
 */
export function formatUnfoldedView(view: UnfoldedView): string {
  const c = view.centers;

  return `
      ${c[0]} ${c[1]}
      ${c[3]} ${c[2]}
${c[4]} ${c[5]}  ${c[8]} ${c[9]}  ${c[12]} ${c[13]}  ${c[16]} ${c[17]}
${c[7]} ${c[6]}  ${c[11]} ${c[10]}  ${c[15]} ${c[14]}  ${c[19]} ${c[18]}
      ${c[20]} ${c[21]}
      ${c[23]} ${c[22]}
`.trim();
}

/**
 * ハッシュ値の妥当性をチェック
 * @param hash ハッシュ値
 * @returns 妥当性チェック結果
 */
export function validateHash(hash: number): {
  valid: boolean;
  whiteCount: number;
  yellowCount: number;
  error?: string;
} {
  const whiteBits = hash & 0xFFFFFF;
  const yellowBits = Math.floor(hash / 0x1000000) & 0xFFFFFF;

  // ビット重複チェック（同じ位置に白と黄の両方があってはいけない）
  if (whiteBits & yellowBits) {
    return {
      valid: false,
      whiteCount: 0,
      yellowCount: 0,
      error: 'Same position cannot have both white and yellow'
    };
  }

  // ビットカウント
  let whiteCount = 0;
  let yellowCount = 0;

  for (let i = 0; i < 24; i++) {
    if ((whiteBits >> i) & 1) whiteCount++;
    if ((yellowBits >> i) & 1) yellowCount++;
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