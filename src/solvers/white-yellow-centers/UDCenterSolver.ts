/**
 * UDCenterSolver - UDセンター状態遷移ソルバー
 *
 * 4x4x4キューブの白黄センター（UDセンター）の状態遷移を解くための汎用ソルバー。
 * 始状態と終状態のハッシュ値を受け取り、双方向探索で解法を見つける。
 */

import { completeHashTables } from './completeHashTables';
import { MOVE_NAMES, ALLOWED_MOVES_FULL, ALLOWED_MOVES_RESTRICTED, INVERSE_MOVES } from './moveTableFixed';
import { validateHash } from '../../utils/white-yellow-centers/hashToUnfoldedView';

/**
 * ソルバーの入力インターフェース
 */
export interface UDCenterSolverInput {
  initialHash: number;  // 始状態のハッシュ値
  goalHash: number;     // 終状態のハッシュ値
}

/**
 * ソルバーの出力インターフェース
 */
export interface UDCenterSolverOutput {
  solution: string[];    // 解法のムーブ列
  moveCount: number;     // 手数
  searchTime: number;    // 探索時間（ミリ秒）
  nodesExpanded: number; // 探索したノード数
  solutionPath?: number[]; // 解法経路のハッシュ値列（可視化用）
  // 全最短解モード用
  allSolutions?: {
    solutions: string[][];    // 全ての最短解のムーブ列
    solutionPaths: number[][]; // 各解の経路ハッシュ値列
  };
}

/**
 * 回転プレフィックスモード
 */
export type RotationPrefixMode = 'none' | 'l-face' | 'all-24';

/**
 * UDCenterSolverのオプション
 */
export interface UDCenterSolverOptions {
  restrictWideMovesToRwUwFw?: boolean; // デフォルトfalse（全36種類を使用）
  rotationPrefixMode?: RotationPrefixMode; // デフォルト'none'（回転プレフィックスを許可しない）
  findAllOptimalSolutions?: boolean; // デフォルトfalse（全最短解を探索するか）
  maxOptimalSolutions?: number; // デフォルト6（全最短解モード時の上限数）
}

/**
 * 回転プレフィックスの型
 */
interface RotationPrefix {
  rotation: string[] | null;
  display: string;
}

/**
 * 第1段階: L面オプション（6種類）
 */
const L_FACE_ROTATIONS: Array<string[] | null> = [
  null,      // なし
  ['y'],
  ["y'"],
  ['y2'],
  ['z'],
  ["z'"],
];

/**
 * 第2段階: x系回転（4種類）
 */
const X_ROTATIONS: Array<string | null> = [null, 'x', 'x2', "x'"];

/**
 * 24通りの回転を生成
 */
function generateAll24Rotations(): RotationPrefix[] {
  const result: RotationPrefix[] = [];

  for (const first of L_FACE_ROTATIONS) {
    for (const second of X_ROTATIONS) {
      if (first === null && second === null) {
        result.push({ rotation: null, display: '' });
      } else if (first === null) {
        result.push({ rotation: [second!], display: second! });
      } else if (second === null) {
        result.push({ rotation: first, display: first.join(' ') });
      } else {
        // y2 x2 は z2 と等価なので、z2 に置き換える
        if (first[0] === 'y2' && second === 'x2') {
          result.push({ rotation: ['z2'], display: 'z2' });
        } else {
          result.push({
            rotation: [...first, second],
            display: [...first, second].join(' ')
          });
        }
      }
    }
  }

  return result;
}

const ALL_24_ROTATIONS = generateAll24Rotations();

/**
 * 回転プレフィックスリストを取得
 */
function getRotationPrefixes(mode: RotationPrefixMode): RotationPrefix[] {
  switch (mode) {
    case 'none':
      return [{ rotation: null, display: '' }];
    case 'l-face':
      return [
        { rotation: null, display: '' },
        { rotation: ['y'], display: 'y' },
        { rotation: ["y'"], display: "y'" },
        { rotation: ['y2'], display: 'y2' },
        { rotation: ['z'], display: 'z' },
        { rotation: ["z'"], display: "z'" },
      ];
    case 'all-24':
      return ALL_24_ROTATIONS;
  }
}

/**
 * 複合回転を適用
 */
function applyRotations(hash: number, rotations: string[] | null): number {
  if (!rotations) return hash;
  let result = hash;
  for (const rotation of rotations) {
    result = completeHashTables.applyMove(result, rotation);
  }
  return result;
}

/**
 * 探索ノードの構造
 */
interface SearchNode {
  hash: number;
  moves: number[];  // moveIndices
}

/**
 * 出会い点の情報
 */
interface Meeting {
  hash: number;
  forwardMoves: number[];
  backwardMoves: number[];
}

/**
 * UDCenterSolverクラス
 *
 * 4x4x4キューブの白黄センター（UDセンター）の状態遷移を解くためのソルバー。
 * 双方向探索アルゴリズムを使用して、始状態から終状態への最短手順を見つける。
 */
export class UDCenterSolver {
  private static readonly MAX_DEPTH = 10;
  private static readonly MAX_SEARCH_TIME = 10000; // 10秒

  /**
   * ハッシュ値の妥当性を検証
   */
  static validateHash(hash: number): boolean {
    try {
      validateHash(hash);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 始状態から終状態への解法を探索
   * @param initialHash 始状態のハッシュ値
   * @param goalHash 終状態のハッシュ値
   * @param options ソルバーのオプション
   */
  static async solve(
    initialHash: number,
    goalHash: number,
    options: UDCenterSolverOptions = {}
  ): Promise<UDCenterSolverOutput | null> {
    // ハッシュ値の検証
    if (!UDCenterSolver.validateHash(initialHash) || !UDCenterSolver.validateHash(goalHash)) {
      throw new Error('Invalid hash value');
    }

    // 同一ハッシュの場合
    if (initialHash === goalHash) {
      const baseResult = {
        solution: [],
        moveCount: 0,
        searchTime: 0,
        nodesExpanded: 0,
        solutionPath: [initialHash]
      };
      // 全最短解モード
      if (options.findAllOptimalSolutions) {
        return {
          ...baseResult,
          allSolutions: {
            solutions: [[]],
            solutionPaths: [[initialHash]]
          }
        };
      }
      return baseResult;
    }

    const startTime = Date.now();
    const result = await UDCenterSolver.bidirectionalSearch(initialHash, goalHash, options);
    const searchTime = Date.now() - startTime;

    if (result) {
      return {
        ...result,
        searchTime
      };
    }

    return null;
  }

  /**
   * 双方向探索の実装（深さレベル単位での展開）
   *
   * 最短解を保証するため、各深さレベルを完全に展開してから次の深さに進む。
   * これにより、出会い検出時点で最短の解が見つかることが保証される。
   */
  private static async bidirectionalSearch(
    initialHash: number,
    goalHash: number,
    options: UDCenterSolverOptions = {}
  ): Promise<Omit<UDCenterSolverOutput, 'searchTime'> | null> {
    const startTime = Date.now();

    // オプションに基づいて使用するムーブセットを選択
    const allowedMoves = options.restrictWideMovesToRwUwFw
      ? ALLOWED_MOVES_RESTRICTED
      : ALLOWED_MOVES_FULL;

    // 回転プレフィックスのリスト
    const rotationPrefixes = getRotationPrefixes(options.rotationPrefixMode ?? 'none');

    // 全最短解モードの設定
    const findAllOptimalSolutions = options.findAllOptimalSolutions ?? false;
    const maxSolutions = options.maxOptimalSolutions ?? 6;

    // 前方探索用のデータ構造
    const forwardVisited = new Map<number, number[]>();
    let forwardCurrentLevel: SearchNode[] = [];
    // 回転プレフィックスごとの情報を保持（ハッシュ → 回転表示名のマップ）
    const rotationMap = new Map<number, string>();

    // 全ての回転パターンを前方探索の初期レベルに追加
    for (const prefix of rotationPrefixes) {
      const rotatedInitialHash = applyRotations(initialHash, prefix.rotation);

      // 回転適用後にゴールと一致する場合（0手で到達可能）
      if (rotatedInitialHash === goalHash) {
        const solution = prefix.display ? [prefix.display] : [];
        const solutionPath = prefix.display
          ? [initialHash, rotatedInitialHash]
          : [initialHash];
        const baseResult = {
          solution,
          moveCount: 0,  // 回転は手数にカウントしない
          nodesExpanded: 0,
          solutionPath
        };
        // 全最短解モードでも0手の場合は1つの解のみ
        if (findAllOptimalSolutions) {
          return {
            ...baseResult,
            allSolutions: {
              solutions: [solution],
              solutionPaths: [solutionPath]
            }
          };
        }
        return baseResult;
      }

      // 未訪問の場合のみ追加（複数の回転で同じハッシュになる場合を考慮）
      if (!forwardVisited.has(rotatedInitialHash)) {
        forwardCurrentLevel.push({ hash: rotatedInitialHash, moves: [] });
        forwardVisited.set(rotatedInitialHash, []);
        rotationMap.set(rotatedInitialHash, prefix.display);
      }
    }

    // 後方探索用のデータ構造
    const backwardVisited = new Map<number, number[]>();
    let backwardCurrentLevel: SearchNode[] = [{ hash: goalHash, moves: [] }];
    backwardVisited.set(goalHash, []);

    let totalNodesExpanded = 0;
    const maxDepthEach = Math.floor(UDCenterSolver.MAX_DEPTH / 2) + 1;

    // 深さレベルを管理
    let forwardDepth = 0;
    let backwardDepth = 0;

    // 出会いリスト
    const meetings: Meeting[] = [];

    // 全最短解モード用: 各深さの経路を保持
    let forwardDepthPaths: Map<number, number[][]> | null = null;
    let backwardDepthPaths: Map<number, number[][]> | null = null;

    // 深さレベル単位での双方向探索
    while (forwardDepth < maxDepthEach || backwardDepth < maxDepthEach) {
      // タイムアウトチェック
      if (Date.now() - startTime > UDCenterSolver.MAX_SEARCH_TIME) {
        return null;
      }

      // 全最短解モード: 現在の深さの経路マップを初期化
      if (findAllOptimalSolutions) {
        forwardDepthPaths = new Map<number, number[][]>();
      }

      // 前方探索: 現在レベルの全ノードを展開
      if (forwardDepth < maxDepthEach && forwardCurrentLevel.length > 0) {
        const result = UDCenterSolver.expandLevel(
          forwardCurrentLevel,
          forwardVisited,
          backwardVisited,
          allowedMoves,
          meetings,
          true,
          findAllOptimalSolutions,
          forwardDepthPaths ?? undefined
        );
        forwardCurrentLevel = result.nextLevel;
        totalNodesExpanded += result.nodesExpanded;
      }
      forwardDepth++;

      // 全最短解モード: 現在の深さで出会いを収集
      if (findAllOptimalSolutions && forwardDepthPaths && forwardDepthPaths.size > 0) {
        UDCenterSolver.collectAllMeetings(
          forwardDepthPaths,
          backwardVisited,
          backwardDepthPaths,
          meetings,
          true,
          maxSolutions
        );
      }

      // 出会いがあれば結果を返す
      if (meetings.length > 0) {
        if (findAllOptimalSolutions) {
          const allResult = UDCenterSolver.selectAllBestMeetings(meetings, rotationMap, initialHash, goalHash, maxSolutions);
          return {
            solution: allResult.solutions[0],
            moveCount: allResult.solutions[0].length - (rotationMap.get(UDCenterSolver.findInitialHashFromMoves(meetings[0].hash, meetings[0].forwardMoves)) ? 1 : 0),
            nodesExpanded: totalNodesExpanded,
            solutionPath: allResult.solutionPaths[0],
            allSolutions: {
              solutions: allResult.solutions,
              solutionPaths: allResult.solutionPaths
            }
          };
        } else {
          const result = UDCenterSolver.selectBestMeeting(meetings, rotationMap, initialHash, goalHash);
          return {
            ...result,
            nodesExpanded: totalNodesExpanded
          };
        }
      }

      // 全最短解モード: 現在の深さの経路マップを初期化
      if (findAllOptimalSolutions) {
        backwardDepthPaths = new Map<number, number[][]>();
      }

      // 後方探索: 現在レベルの全ノードを展開
      if (backwardDepth < maxDepthEach && backwardCurrentLevel.length > 0) {
        const result = UDCenterSolver.expandLevel(
          backwardCurrentLevel,
          backwardVisited,
          forwardVisited,
          allowedMoves,
          meetings,
          false,
          findAllOptimalSolutions,
          backwardDepthPaths ?? undefined
        );
        backwardCurrentLevel = result.nextLevel;
        totalNodesExpanded += result.nodesExpanded;
      }
      backwardDepth++;

      // 全最短解モード: 現在の深さで出会いを収集
      if (findAllOptimalSolutions && backwardDepthPaths && backwardDepthPaths.size > 0) {
        UDCenterSolver.collectAllMeetings(
          backwardDepthPaths,
          forwardVisited,
          forwardDepthPaths,
          meetings,
          false,
          maxSolutions
        );
      }

      // 出会いがあれば結果を返す
      if (meetings.length > 0) {
        if (findAllOptimalSolutions) {
          const allResult = UDCenterSolver.selectAllBestMeetings(meetings, rotationMap, initialHash, goalHash, maxSolutions);
          return {
            solution: allResult.solutions[0],
            moveCount: allResult.solutions[0].length - (rotationMap.get(UDCenterSolver.findInitialHashFromMoves(meetings[0].hash, meetings[0].forwardMoves)) ? 1 : 0),
            nodesExpanded: totalNodesExpanded,
            solutionPath: allResult.solutionPaths[0],
            allSolutions: {
              solutions: allResult.solutions,
              solutionPaths: allResult.solutionPaths
            }
          };
        } else {
          const result = UDCenterSolver.selectBestMeeting(meetings, rotationMap, initialHash, goalHash);
          return {
            ...result,
            nodesExpanded: totalNodesExpanded
          };
        }
      }

      // 両方のレベルが空の場合は終了
      if (forwardCurrentLevel.length === 0 && backwardCurrentLevel.length === 0) {
        break;
      }
    }

    return null;
  }

  /**
   * 現在レベルの全ノードを展開するヘルパーメソッド
   * @param currentLevel 現在レベルのノード配列
   * @param visited 訪問済みノードマップ
   * @param otherVisited 相手側の訪問済みノードマップ（出会いチェック用）
   * @param allowedMoves 許可されたムーブのリスト
   * @param meetings 出会いを記録するリスト
   * @param isForward 前方探索かどうか
   * @param findAllOptimalSolutions 全最短解モードかどうか
   * @param currentDepthPaths 全最短解モード時、同じ深さの全経路を記録するマップ
   * @returns { nextLevel: 次レベルのノード配列, nodesExpanded: 展開したノード数 }
   */
  private static expandLevel(
    currentLevel: SearchNode[],
    visited: Map<number, number[]>,
    otherVisited: Map<number, number[]>,
    allowedMoves: number[],
    meetings: Meeting[],
    isForward: boolean,
    findAllOptimalSolutions: boolean = false,
    currentDepthPaths?: Map<number, number[][]>
  ): { nextLevel: SearchNode[]; nodesExpanded: number } {
    const nextLevel: SearchNode[] = [];
    let nodesExpanded = 0;

    // 現在レベルの全ノードを処理
    for (const node of currentLevel) {
      nodesExpanded++;

      const lastMove = node.moves[node.moves.length - 1];

      for (const moveIndex of allowedMoves) {
        // プルーニング: 同じムーブの連続や逆ムーブを避ける
        // 後方探査では枝刈りルールを反転させる
        if (UDCenterSolver.shouldPrune(lastMove, moveIndex, isForward)) {
          continue;
        }

        // 新しい状態を生成
        const newHash = completeHashTables.applyMoveByIndex(node.hash, moveIndex);
        const newMoves = [...node.moves, moveIndex];

        // 全最短解モード: 同じ深さの全経路を記録
        if (findAllOptimalSolutions && currentDepthPaths) {
          if (!currentDepthPaths.has(newHash)) {
            currentDepthPaths.set(newHash, []);
          }
          currentDepthPaths.get(newHash)!.push(newMoves);
        }

        // 未訪問の場合のみ次レベルに追加
        if (!visited.has(newHash)) {
          visited.set(newHash, newMoves);
          nextLevel.push({
            hash: newHash,
            moves: newMoves
          });

          // 通常モード: 即座に出会いをチェック
          if (!findAllOptimalSolutions && otherVisited.has(newHash)) {
            const otherMoves = otherVisited.get(newHash)!;
            const forwardMoves = isForward ? newMoves : otherMoves;
            const backwardMoves = isForward ? otherMoves : newMoves;

            // 接続部の検証: 前方と後方の接続が枝刈りルールに違反していないか
            const forwardLastMove = forwardMoves.length > 0
              ? forwardMoves[forwardMoves.length - 1]
              : undefined;
            if (UDCenterSolver.isValidConnection(forwardLastMove, backwardMoves)) {
              meetings.push({
                hash: newHash,
                forwardMoves,
                backwardMoves
              });
            }
          }
        }
      }
    }

    return { nextLevel, nodesExpanded };
  }

  /**
   * 出会いリストから最短の解を選択して返す
   */
  private static selectBestMeeting(
    meetings: Meeting[],
    rotationMap: Map<number, string>,
    initialHash: number,
    goalHash: number
  ): Omit<UDCenterSolverOutput, 'searchTime' | 'nodesExpanded'> {
    let bestResult: Omit<UDCenterSolverOutput, 'searchTime' | 'nodesExpanded'> | null = null;
    let bestMoveCount = Infinity;

    for (const meeting of meetings) {
      const moveCount = meeting.forwardMoves.length + meeting.backwardMoves.length;

      if (moveCount < bestMoveCount) {
        // 回転プレフィックスを逆算
        const rotatedInitialHash = UDCenterSolver.findInitialHashFromMoves(meeting.hash, meeting.forwardMoves);
        const rotationDisplay = rotationMap.get(rotatedInitialHash) ?? '';

        const solution = UDCenterSolver.constructSolution(meeting.forwardMoves, meeting.backwardMoves, rotationDisplay);
        const solutionPath = UDCenterSolver.reconstructPath(
          initialHash,
          rotatedInitialHash,
          meeting.forwardMoves,
          meeting.backwardMoves,
          goalHash,
          rotationDisplay
        );

        bestMoveCount = moveCount;
        bestResult = {
          solution,
          moveCount: solution.length - (rotationDisplay ? 1 : 0),
          solutionPath
        };
      }
    }

    // meetingsが空でない前提で呼ばれるので、必ず結果がある
    return bestResult!;
  }

  /**
   * 全最短解モード用: 同じ深さで到達可能な全経路から出会いを収集
   */
  private static collectAllMeetings(
    currentDepthPaths: Map<number, number[][]>,
    otherVisited: Map<number, number[]>,
    otherDepthPaths: Map<number, number[][]> | null,
    meetings: Meeting[],
    isForward: boolean,
    maxSolutions: number
  ): void {
    for (const [hash, paths] of currentDepthPaths) {
      // 相手側のvisitedに存在するか確認
      const otherMoves = otherVisited.get(hash);
      if (otherMoves !== undefined) {
        // 相手側の全経路を取得（同じ深さの経路があればそれも含む）
        const otherPaths = otherDepthPaths?.get(hash) ?? [otherMoves];

        // 全組み合わせを生成
        for (const path of paths) {
          for (const otherPath of otherPaths) {
            const forwardMoves = isForward ? path : otherPath;
            const backwardMoves = isForward ? otherPath : path;

            // 接続部の検証: 前方と後方の接続が枝刈りルールに違反していないか
            const forwardLastMove = forwardMoves.length > 0
              ? forwardMoves[forwardMoves.length - 1]
              : undefined;
            if (UDCenterSolver.isValidConnection(forwardLastMove, backwardMoves)) {
              meetings.push({
                hash,
                forwardMoves,
                backwardMoves
              });
              if (meetings.length >= maxSolutions) return;
            }
          }
        }
      }
    }
  }

  /**
   * 全最短解モード用: 全ての最短解を選択して返す
   */
  private static selectAllBestMeetings(
    meetings: Meeting[],
    rotationMap: Map<number, string>,
    initialHash: number,
    goalHash: number,
    maxSolutions: number
  ): { solutions: string[][]; solutionPaths: number[][]; moveCount: number } {
    // 最短手数を見つける
    let minMoveCount = Infinity;
    for (const meeting of meetings) {
      const moveCount = meeting.forwardMoves.length + meeting.backwardMoves.length;
      if (moveCount < minMoveCount) {
        minMoveCount = moveCount;
      }
    }

    // 最短手数の解のみを収集
    const solutions: string[][] = [];
    const solutionPaths: number[][] = [];
    const seenSolutions = new Set<string>();

    for (const meeting of meetings) {
      const moveCount = meeting.forwardMoves.length + meeting.backwardMoves.length;
      if (moveCount !== minMoveCount) continue;

      // 回転プレフィックスを逆算
      const rotatedInitialHash = UDCenterSolver.findInitialHashFromMoves(meeting.hash, meeting.forwardMoves);
      const rotationDisplay = rotationMap.get(rotatedInitialHash) ?? '';

      const solution = UDCenterSolver.constructSolution(meeting.forwardMoves, meeting.backwardMoves, rotationDisplay);

      // 重複チェック（同じ解法は追加しない）
      const solutionKey = solution.join(' ');
      if (seenSolutions.has(solutionKey)) continue;
      seenSolutions.add(solutionKey);

      const solutionPath = UDCenterSolver.reconstructPath(
        initialHash,
        rotatedInitialHash,
        meeting.forwardMoves,
        meeting.backwardMoves,
        goalHash,
        rotationDisplay
      );

      solutions.push(solution);
      solutionPaths.push(solutionPath);

      if (solutions.length >= maxSolutions) break;
    }

    return {
      solutions,
      solutionPaths,
      moveCount: minMoveCount === Infinity ? 0 : solutions[0].length - (rotationMap.get(UDCenterSolver.findInitialHashFromMoves(meetings[0]?.hash ?? initialHash, meetings[0]?.forwardMoves ?? [])) ? 1 : 0)
    };
  }

  /**
   * ムーブ列から初期状態のハッシュを逆算
   */
  private static findInitialHashFromMoves(currentHash: number, moves: number[]): number {
    if (moves.length === 0) {
      return currentHash;
    }

    let hash = currentHash;
    const reversedMoves = moves.slice().reverse();

    for (const moveIndex of reversedMoves) {
      const inverseMove = INVERSE_MOVES[moveIndex];
      hash = completeHashTables.applyMoveByIndex(hash, inverseMove);
    }

    return hash;
  }

  /**
   * プルーニング判定（改善版）
   * 同一面の連続を完全禁止し、ワイドムーブの優先順位制御を実装
   * @param isForward 前方探査の場合true、後方探査の場合false
   */
  private static shouldPrune(
    lastMove: number | undefined,
    currentMove: number,
    isForward: boolean = true
  ): boolean {
    if (lastMove === undefined) return false;

    // 1. 同一面の連続を完全に禁止（方向に依存しない）
    const lastFace = Math.floor(lastMove / 3) % 6;
    const currentFace = Math.floor(currentMove / 3) % 6;
    if (lastFace === currentFace) {
      return true;
    }

    // 2. ムーブの分類を取得
    const getMoveInfo = (idx: number): { axis: 'x' | 'y' | 'z', isPrimary: boolean, isWide: boolean, face: number } => {
      const face = Math.floor(idx / 3) % 6;
      const isWide = idx >= 18;

      switch(face) {
        case 0: // R or Rw
          return { axis: 'x', isPrimary: true, isWide, face };
        case 1: // L or Lw
          return { axis: 'x', isPrimary: false, isWide, face };
        case 2: // U or Uw
          return { axis: 'y', isPrimary: true, isWide, face };
        case 3: // D or Dw
          return { axis: 'y', isPrimary: false, isWide, face };
        case 4: // F or Fw
          return { axis: 'z', isPrimary: true, isWide, face };
        case 5: // B or Bw
          return { axis: 'z', isPrimary: false, isWide, face };
        default:
          // これは到達しないはずだが、TypeScriptの型チェックのため
          return { axis: 'x', isPrimary: true, isWide, face };
      }
    };

    const lastInfo = getMoveInfo(lastMove);
    const currentInfo = getMoveInfo(currentMove);

    // 3. 同一軸での順序制御
    if (lastInfo.axis === currentInfo.axis) {
      // 優先順位: primary外層 > secondary外層 > primaryワイド > secondaryワイド
      const lastPriority = (lastInfo.isPrimary ? 0 : 1) + (lastInfo.isWide ? 2 : 0);
      const currentPriority = (currentInfo.isPrimary ? 0 : 1) + (currentInfo.isWide ? 2 : 0);

      if (isForward) {
        // 前方探査: currentPriority < lastPriority → 禁止
        if (currentPriority < lastPriority) {
          return true;
        }
      } else {
        // 後方探査: lastPriority < currentPriority → 禁止
        if (lastPriority < currentPriority) {
          return true;
        }
      }
    }

    // 4. 外層ムーブ連続時の順序制御（RUFLDB順）
    // 異なる軸の外層ムーブ同士は可換なので、一方の順序のみを許可
    if (!lastInfo.isWide && !currentInfo.isWide && lastInfo.axis !== currentInfo.axis) {
      const OUTER_MOVE_ORDER: Record<number, number> = {
        0: 0, // R → 順序0
        2: 1, // U → 順序1
        4: 2, // F → 順序2
        1: 3, // L → 順序3
        3: 4, // D → 順序4
        5: 5, // B → 順序5
      };
      const lastOrder = OUTER_MOVE_ORDER[lastInfo.face];
      const currentOrder = OUTER_MOVE_ORDER[currentInfo.face];

      if (isForward) {
        // 前方探査: currentOrder < lastOrder → 禁止
        if (currentOrder < lastOrder) {
          return true;
        }
      } else {
        // 後方探査: lastOrder < currentOrder → 禁止
        if (lastOrder < currentOrder) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 前方探査と後方探査の接続部が枝刈りルールに違反していないかを検証
   */
  private static isValidConnection(
    forwardLastMove: number | undefined,
    backwardMoves: number[]
  ): boolean {
    if (forwardLastMove === undefined || backwardMoves.length === 0) {
      return true;
    }

    // 後方探査を変換した後の最初の手: INVERSE(backwardMoves の最後の要素)
    const transformedFirstMove = INVERSE_MOVES[backwardMoves[backwardMoves.length - 1]];

    // 前方ルールで接続部を検証
    return !UDCenterSolver.shouldPrune(forwardLastMove, transformedFirstMove, true);
  }

  /**
   * 解法を構築
   */
  private static constructSolution(
    forwardMoves: number[],
    backwardMoves: number[],
    rotationPrefix: string = ''
  ): string[] {
    // 後方探索の手順を逆転して逆ムーブを適用
    const inversedBackward = backwardMoves
      .map(m => INVERSE_MOVES[m])
      .reverse();

    // 前方と後方を結合
    const allMoves = [...forwardMoves, ...inversedBackward];

    // ムーブ名に変換
    const moveNames = allMoves.map(i => MOVE_NAMES[i]);

    // 回転プレフィックスがある場合は先頭に追加
    if (rotationPrefix) {
      return [rotationPrefix, ...moveNames];
    }

    return moveNames;
  }

  /**
   * 解法経路のハッシュ値列を再構築（可視化用）
   */
  private static reconstructPath(
    originalInitialHash: number,
    rotatedInitialHash: number,
    forwardMoves: number[],
    backwardMoves: number[],
    goalHash: number,
    rotationPrefix: string = ''
  ): number[] {
    const path: number[] = [];

    // 回転プレフィックスがある場合
    if (rotationPrefix) {
      path.push(originalInitialHash);    // 元の状態
      path.push(rotatedInitialHash);     // 回転後の状態
    } else {
      path.push(originalInitialHash);
    }

    let currentHash = rotatedInitialHash;

    // 前方の経路を辿る
    for (const moveIndex of forwardMoves) {
      currentHash = completeHashTables.applyMoveByIndex(currentHash, moveIndex);
      path.push(currentHash);
    }

    // 後方の経路を辿る（逆順で逆ムーブ）
    const inversedBackward = backwardMoves.map(m => INVERSE_MOVES[m]).reverse();
    for (const moveIndex of inversedBackward) {
      currentHash = completeHashTables.applyMoveByIndex(currentHash, moveIndex);
      path.push(currentHash);
    }

    // 最後がゴールハッシュと一致することを確認（デバッグ用）
    if (path[path.length - 1] !== goalHash) {
      console.warn('Path reconstruction error: final hash does not match goal');
    }

    return path;
  }
}

// 後方互換性のためのエイリアス（非推奨）
/** @deprecated Use UDCenterSolver instead */
export const SimpleSolver = UDCenterSolver;
/** @deprecated Use UDCenterSolverOptions instead */
export type SimpleSolverOptions = UDCenterSolverOptions;
/** @deprecated Use UDCenterSolverOutput instead */
export type SolverOutput = UDCenterSolverOutput;
/** @deprecated Use UDCenterSolverInput instead */
export type SolverInput = UDCenterSolverInput;
