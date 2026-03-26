/**
 * UDCenterSolver のテストケース
 */

import { describe, it, expect } from 'vitest';
import { UDCenterSolver } from '../UDCenterSolver';
import { completeHashTables } from '../completeHashTables';
import { generateRandomHash, generateGoalHash } from '../../../utils/white-yellow-centers/randomHashGenerator';

describe('UDCenterSolver', () => {
  describe('validateHash', () => {
    it('有効なハッシュ値を受け入れる', () => {
      // ゴール状態のハッシュ（白がU面、黄がD面）
      const goalHash = 0x0F00000000F0; // 0x00000F00F00000 の場合もある
      expect(UDCenterSolver.validateHash(goalHash)).toBe(true);
    });

    it('ランダムな有効ハッシュを受け入れる', () => {
      const randomHash = generateRandomHash();
      expect(UDCenterSolver.validateHash(randomHash)).toBe(true);
    });
  });

  describe('solve - 基本的な探索', () => {
    it('同一ハッシュの場合は0手の解を返す', async () => {
      const hash = generateRandomHash();
      const result = await UDCenterSolver.solve(hash, hash);

      expect(result).not.toBeNull();
      expect(result!.solution).toEqual([]);
      expect(result!.moveCount).toBe(0);
      expect(result!.nodesExpanded).toBe(0);
    });

    it('2手で解ける問題を解く', async () => {
      const goalHash = generateGoalHash();
      // R U を適用して2手分離れた状態を作成
      let initialHash = goalHash;
      initialHash = completeHashTables.applyMove(initialHash, 'R');
      initialHash = completeHashTables.applyMove(initialHash, 'U');

      const result = await UDCenterSolver.solve(initialHash, goalHash);

      expect(result).not.toBeNull();
      expect(result!.moveCount).toBeLessThanOrEqual(2);
      // 解法が正しいことを検証
      if (result) {
        let testHash = initialHash;
        for (const move of result.solution) {
          testHash = completeHashTables.applyMove(testHash, move);
        }
        expect(testHash).toBe(goalHash);
      }
    });

  });

  describe('パフォーマンステスト', () => {
    it('3手の問題を1000ms以内に解く', async () => {
      const goalHash = generateGoalHash();
      let initialHash = goalHash;
      initialHash = completeHashTables.applyMove(initialHash, 'R');
      initialHash = completeHashTables.applyMove(initialHash, 'U');
      initialHash = completeHashTables.applyMove(initialHash, 'F');

      const startTime = Date.now();
      const result = await UDCenterSolver.solve(initialHash, goalHash);
      const endTime = Date.now();

      expect(result).not.toBeNull();
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result!.moveCount).toBeLessThanOrEqual(3);
    });

    it('ランダムな問題を5秒以内に解くかタイムアウトする', async () => {
      const initialHash = generateRandomHash();
      const goalHash = generateGoalHash();

      const startTime = Date.now();
      const result = await UDCenterSolver.solve(initialHash, goalHash);
      const endTime = Date.now();

      // 5秒以内に完了することを確認
      expect(endTime - startTime).toBeLessThan(5100); // 少し余裕を持たせる

      if (result) {
        // 解が見つかった場合、それが正しいことを検証
        let testHash = initialHash;
        for (const move of result.solution) {
          testHash = completeHashTables.applyMove(testHash, move);
        }
        expect(testHash).toBe(goalHash);
      }
    }, 10000); // jest のタイムアウトを10秒に設定
  });

  describe('解法の正確性検証', () => {
    it('見つかった解法が実際に問題を解く', async () => {
      // 複数のランダムケースでテスト
      for (let i = 0; i < 5; i++) {
        const goalHash = generateGoalHash();
        let initialHash = goalHash;

        // ランダムに2-3手のシャッフル
        const moves = ['R', 'U', 'F', "R'", "U'", "F'"];
        const shuffleCount = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < shuffleCount; j++) {
          const move = moves[Math.floor(Math.random() * moves.length)];
          initialHash = completeHashTables.applyMove(initialHash, move);
        }

        const result = await UDCenterSolver.solve(initialHash, goalHash);

        if (result) {
          // 解法を適用して実際にゴールに到達するか確認
          let currentHash = initialHash;
          for (const move of result.solution) {
            currentHash = completeHashTables.applyMove(currentHash, move);
          }
          expect(currentHash).toBe(goalHash);

          // 手数が妥当であることを確認
          expect(result.moveCount).toBeLessThanOrEqual(10);
        }
      }
    }, 15000); // 複数ケースのため長めのタイムアウト
  });

  describe('UDCenterSolver - ワイドムーブ制御', () => {
    it('デフォルトで全36種類のムーブを使用できる', async () => {
      const goalHash = generateGoalHash();
      // Lwムーブで作成した問題を解けることを確認
      const initialHash = completeHashTables.applyMove(goalHash, 'Lw');
      const result = await UDCenterSolver.solve(initialHash, goalHash);

      expect(result).not.toBeNull();
      expect(result!.moveCount).toBeGreaterThan(0);

      // 解法を適用して実際にゴールに到達するか確認
      let testHash = initialHash;
      for (const move of result!.solution) {
        testHash = completeHashTables.applyMove(testHash, move);
      }
      expect(testHash).toBe(goalHash);
    });

    it('オプションでLw, Dw, Bwムーブを制限できる', async () => {
      const goalHash = generateGoalHash();
      // Rムーブで作成した問題（制限ムーブでも解ける）
      const initialHash = completeHashTables.applyMove(goalHash, 'R');
      const result = await UDCenterSolver.solve(initialHash, goalHash, {
        restrictWideMovesToRwUwFw: true
      });

      expect(result).not.toBeNull();
      // Lw, Dw, Bwが解法に含まれていないことを確認
      const solutionStr = result!.solution.join(' ');
      expect(solutionStr).not.toMatch(/\bLw/);
      expect(solutionStr).not.toMatch(/\bDw/);
      expect(solutionStr).not.toMatch(/\bBw/);
    });

    it('Lwムーブを含む複数手の問題を解く', async () => {
      const goalHash = generateGoalHash();
      let initialHash = goalHash;
      initialHash = completeHashTables.applyMove(initialHash, 'Lw');
      initialHash = completeHashTables.applyMove(initialHash, 'U');

      const result = await UDCenterSolver.solve(initialHash, goalHash);

      expect(result).not.toBeNull();
      // 解法の正当性を検証
      let testHash = initialHash;
      for (const move of result!.solution) {
        testHash = completeHashTables.applyMove(testHash, move);
      }
      expect(testHash).toBe(goalHash);
    });
  });

  describe('UDCenterSolver - プルーニング検証', () => {
    it('同一面の連続が解法に含まれない', async () => {
      // 複数のランダムケースでテスト
      for (let i = 0; i < 3; i++) {
        const goalHash = generateGoalHash();
        let initialHash = goalHash;

        // ランダムに2-3手のシャッフル
        const moves = ['R', 'U', 'F', 'Rw', 'Uw', 'Fw'];
        const shuffleCount = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < shuffleCount; j++) {
          const move = moves[Math.floor(Math.random() * moves.length)];
          initialHash = completeHashTables.applyMove(initialHash, move);
        }

        const result = await UDCenterSolver.solve(initialHash, goalHash);

        if (result && result.solution.length > 1) {
          // 解法に同一面の連続がないことを検証
          for (let k = 0; k < result.solution.length - 1; k++) {
            const currentMove = result.solution[k];
            const nextMove = result.solution[k + 1];

            // 面を取得（R, R', R2は全て"R"面）
            const getCurrentFace = (move: string) => move.replace(/[w'2]/g, '');

            expect(getCurrentFace(currentMove)).not.toBe(getCurrentFace(nextMove));
          }
        }
      }
    }, 15000);

    it('対面とワイドムーブの順序が正しく制御される', async () => {
      const goalHash = generateGoalHash();
      let initialHash = goalHash;

      // RとLを使った問題を作成
      initialHash = completeHashTables.applyMove(initialHash, 'R');
      initialHash = completeHashTables.applyMove(initialHash, 'L');

      const result = await UDCenterSolver.solve(initialHash, goalHash);

      if (result && result.solution.length > 1) {
        // L → R の順序は許可されない（R → L のみ許可）
        for (let i = 0; i < result.solution.length - 1; i++) {
          const current = result.solution[i];
          const next = result.solution[i + 1];

          if (current.startsWith('L') && next.startsWith('R')) {
            fail('L → R の順序が検出されました（禁止パターン）');
          }
        }
      }
    });

    it('外層ムーブ連続時のRUFLDB順序が守られる', async () => {
      const goalHash = generateGoalHash();
      let initialHash = goalHash;

      // 複数の外層ムーブを使った問題を作成
      initialHash = completeHashTables.applyMove(initialHash, 'R');
      initialHash = completeHashTables.applyMove(initialHash, 'U');
      initialHash = completeHashTables.applyMove(initialHash, 'F');

      const result = await UDCenterSolver.solve(initialHash, goalHash);

      if (result && result.solution.length > 1) {
        // RUFLDB順序マップ
        const orderMap: Record<string, number> = {
          'R': 0, 'U': 1, 'F': 2, 'L': 3, 'D': 4, 'B': 5
        };

        const getFace = (move: string) => move.replace(/[w'2]/g, '');
        const isOuterMove = (move: string) => !move.includes('w');

        for (let i = 0; i < result.solution.length - 1; i++) {
          const current = result.solution[i];
          const next = result.solution[i + 1];

          // 両方が外層ムーブの場合のみチェック
          if (isOuterMove(current) && isOuterMove(next)) {
            const currentFace = getFace(current);
            const nextFace = getFace(next);

            // 異なる面の場合、順序をチェック
            if (currentFace !== nextFace) {
              const currentOrder = orderMap[currentFace];
              const nextOrder = orderMap[nextFace];

              expect(nextOrder).toBeGreaterThan(currentOrder);
            }
          }
        }
      }
    });
  });

  describe('UDCenterSolver - タイムアウト延長', () => {
    it('10秒以内に解を見つけるかタイムアウトする', async () => {
      const initialHash = generateRandomHash();
      const goalHash = generateGoalHash();

      const startTime = Date.now();
      const result = await UDCenterSolver.solve(initialHash, goalHash);
      const endTime = Date.now();

      // 10秒以内に完了することを確認（少し余裕を持たせる）
      expect(endTime - startTime).toBeLessThan(10100);

      if (result) {
        // 解が見つかった場合、それが正しいことを検証
        let testHash = initialHash;
        for (const move of result.solution) {
          testHash = completeHashTables.applyMove(testHash, move);
        }
        expect(testHash).toBe(goalHash);
      }
    }, 15000); // jestのタイムアウトを15秒に設定
  });

  describe('回転プレフィックス機能', () => {
    it('デフォルトでは回転プレフィックスを使用しない', async () => {
      const goalHash = generateGoalHash();
      const initialHash = completeHashTables.applyMove(goalHash, 'y');

      const result = await UDCenterSolver.solve(initialHash, goalHash);

      expect(result).not.toBeNull();
      expect(result!.solution[0]).not.toBe('y');
    });

    it('回転プレフィックスが手数にカウントされない', async () => {
      const goalHash = generateGoalHash();
      const tempHash = completeHashTables.applyMove(goalHash, 'z');
      const initialHash = completeHashTables.applyMove(tempHash, 'R');

      const result = await UDCenterSolver.solve(initialHash, goalHash, {
        rotationPrefixMode: 'l-face'
      });

      if (result && ['y', "y'", 'y2', 'z', "z'"].includes(result.solution[0])) {
        expect(result.moveCount).toBe(result.solution.length - 1);
      } else if (result) {
        expect(result.moveCount).toBe(result.solution.length);
      }
    });

    it('解が正しくゴールに到達する', async () => {
      const goalHash = generateGoalHash();
      const temp1 = completeHashTables.applyMove(goalHash, "y'");
      const temp2 = completeHashTables.applyMove(temp1, 'R');
      const initialHash = completeHashTables.applyMove(temp2, 'U');

      const result = await UDCenterSolver.solve(initialHash, goalHash, {
        rotationPrefixMode: 'l-face'
      });

      expect(result).not.toBeNull();

      // 解法を適用してゴールに到達するか確認
      let currentHash = initialHash;
      for (const move of result!.solution) {
        currentHash = completeHashTables.applyMove(currentHash, move);
      }
      expect(currentHash).toBe(goalHash);
    });

    it('z回転プレフィックスも使用できる', async () => {
      const goalHash = generateGoalHash();
      const tempHash = completeHashTables.applyMove(goalHash, 'z');
      const initialHash = completeHashTables.applyMove(tempHash, 'F');

      const result = await UDCenterSolver.solve(initialHash, goalHash, {
        rotationPrefixMode: 'l-face'
      });

      expect(result).not.toBeNull();
      if (result!.solution.length === 2) {
        expect(['z', "z'"]).toContain(result!.solution[0]);
      }
    });

    it('回転プレフィックスなしの場合でも動作する', async () => {
      const goalHash = generateGoalHash();
      const initialHash = completeHashTables.applyMove(goalHash, 'R');

      const resultWithoutPrefix = await UDCenterSolver.solve(initialHash, goalHash, {
        rotationPrefixMode: 'none'
      });

      const resultWithPrefix = await UDCenterSolver.solve(initialHash, goalHash, {
        rotationPrefixMode: 'l-face'
      });

      expect(resultWithoutPrefix).not.toBeNull();
      expect(resultWithPrefix).not.toBeNull();
      // 両方とも解を見つけることを確認
    });

  });

  describe('双方向BFSの最短解保証', () => {
    it('ワイドムーブ制限なしの方が同じか短い解を見つける', async () => {
      const initialHash = 0x02288000402C;
      const goalHash = 0x00f0000000f0;

      // 制限あり（27種類）
      const resultRestricted = await UDCenterSolver.solve(initialHash, goalHash, {
        restrictWideMovesToRwUwFw: true,
        rotationPrefixMode: 'l-face'
      });

      // 制限なし（36種類）
      const resultFull = await UDCenterSolver.solve(initialHash, goalHash, {
        restrictWideMovesToRwUwFw: false,
        rotationPrefixMode: 'l-face'
      });

      expect(resultRestricted).not.toBeNull();
      expect(resultFull).not.toBeNull();

      // 制限なしの方が同じかより短い解を見つけるはず
      expect(resultFull!.moveCount).toBeLessThanOrEqual(resultRestricted!.moveCount);

      // 解法の正当性を検証
      let testHash = initialHash;
      for (const move of resultFull!.solution) {
        testHash = completeHashTables.applyMove(testHash, move);
      }
      expect(testHash).toBe(goalHash);
    }, 30000);
  });

  describe('全最短解探索', () => {
    it('findAllOptimalSolutions=trueで複数の解を返す', async () => {
      const goalHash = generateGoalHash();
      // R U を適用して2手分離れた状態を作成
      let initialHash = goalHash;
      initialHash = completeHashTables.applyMove(initialHash, 'R');
      initialHash = completeHashTables.applyMove(initialHash, 'U');

      const result = await UDCenterSolver.solve(initialHash, goalHash, {
        findAllOptimalSolutions: true
      });

      expect(result).not.toBeNull();
      expect(result!.allSolutions).toBeDefined();
      expect(result!.allSolutions!.solutions.length).toBeGreaterThanOrEqual(1);
      expect(result!.allSolutions!.solutionPaths.length).toBe(result!.allSolutions!.solutions.length);
    });

    it('全ての最短解がゴールに到達する', async () => {
      const goalHash = generateGoalHash();
      let initialHash = goalHash;
      initialHash = completeHashTables.applyMove(initialHash, 'R');
      initialHash = completeHashTables.applyMove(initialHash, 'U');

      const result = await UDCenterSolver.solve(initialHash, goalHash, {
        findAllOptimalSolutions: true
      });

      expect(result).not.toBeNull();
      expect(result!.allSolutions).toBeDefined();

      // 各解がゴールに正しく到達することを検証
      for (const solution of result!.allSolutions!.solutions) {
        let testHash = initialHash;
        for (const move of solution) {
          testHash = completeHashTables.applyMove(testHash, move);
        }
        expect(testHash).toBe(goalHash);
      }
    });

    it('全ての最短解が同じ手数である', async () => {
      const goalHash = generateGoalHash();
      let initialHash = goalHash;
      initialHash = completeHashTables.applyMove(initialHash, 'R');
      initialHash = completeHashTables.applyMove(initialHash, 'U');
      initialHash = completeHashTables.applyMove(initialHash, 'F');

      const result = await UDCenterSolver.solve(initialHash, goalHash, {
        findAllOptimalSolutions: true
      });

      expect(result).not.toBeNull();
      expect(result!.allSolutions).toBeDefined();

      // 全ての解が同じ手数であることを確認
      const firstSolutionLength = result!.allSolutions!.solutions[0].length;
      for (const solution of result!.allSolutions!.solutions) {
        expect(solution.length).toBe(firstSolutionLength);
      }
    });

    it('maxOptimalSolutionsで解の数を制限できる', async () => {
      const goalHash = generateGoalHash();
      let initialHash = goalHash;
      initialHash = completeHashTables.applyMove(initialHash, 'R');
      initialHash = completeHashTables.applyMove(initialHash, 'U');

      const result = await UDCenterSolver.solve(initialHash, goalHash, {
        findAllOptimalSolutions: true,
        maxOptimalSolutions: 2
      });

      expect(result).not.toBeNull();
      expect(result!.allSolutions).toBeDefined();
      expect(result!.allSolutions!.solutions.length).toBeLessThanOrEqual(2);
    });

    it('同一ハッシュの場合は1つの解のみ（0手）', async () => {
      const hash = generateRandomHash();
      const result = await UDCenterSolver.solve(hash, hash, {
        findAllOptimalSolutions: true
      });

      expect(result).not.toBeNull();
      expect(result!.moveCount).toBe(0);
      expect(result!.allSolutions).toBeDefined();
      expect(result!.allSolutions!.solutions.length).toBe(1);
      expect(result!.allSolutions!.solutions[0].length).toBe(0);
    });

    it('solutionPathsの各パスが正しい長さである', async () => {
      const goalHash = generateGoalHash();
      let initialHash = goalHash;
      initialHash = completeHashTables.applyMove(initialHash, 'R');
      initialHash = completeHashTables.applyMove(initialHash, 'U');

      const result = await UDCenterSolver.solve(initialHash, goalHash, {
        findAllOptimalSolutions: true
      });

      expect(result).not.toBeNull();
      expect(result!.allSolutions).toBeDefined();

      // 各solutionPathの長さがsolution.length + 1であることを確認
      for (let i = 0; i < result!.allSolutions!.solutions.length; i++) {
        const solution = result!.allSolutions!.solutions[i];
        const path = result!.allSolutions!.solutionPaths[i];
        // パスは初期状態から始まるので、移動回数+1
        expect(path.length).toBe(solution.length + 1);
      }
    });
  });
});
