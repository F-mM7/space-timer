# Space Timer

## 概要

スペースキーをスイッチにしたタイマーアプリです。スペースキー長押しでスタンバイ、離すと計測開始、再押下で計測停止。記録をlocalStorageに保存し、ヒストグラムで統計表示します。

## デモ

[Space Timer](https://F-mM7.github.io/space-timer/)

## 機能

- スペースキー長押し（0.2秒）でスタンバイ → 離すと計測開始 → 再押下で計測停止
- 記録をlocalStorageに自動保存
- ヒストグラムによる時間分布の可視化
- 記録数・平均時間・標準偏差の統計表示
- スクランブル生成機能

## 技術スタック

- React 19
- TypeScript
- Vite
- Recharts（ヒストグラム表示）
- React Router

## セットアップ

```bash
git clone https://github.com/F-mM7/space-timer.git
cd space-timer
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## ライセンス

MIT
