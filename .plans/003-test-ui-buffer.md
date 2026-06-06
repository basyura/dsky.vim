# denops/dsky/ui/buffer.ts のテスト追加計画

## 目的

`denops/dsky/ui/buffer.ts` の表示処理を単体テストで検証し、Denops 側のテスト網羅を広げる。

## 対象

- `denops/dsky/ui/buffer.ts`
- 追加予定: `denops/dsky/ui/buffer_test.ts`

## 現状

- `ui/buffer.ts` には専用テストがない。
- `loadTimeline()` は Denops API と Vim 関数呼び出しに依存している。
- 内部処理は以下のような責務を持つ。
  - バッファの前処理と後処理
  - 投稿本文の整形済み行をバッファへ設定
  - 投稿間のセパレータ生成
  - ウィンドウ幅に応じた区切り線生成

## 方針

1. `Denops` の最小モックを用意する。
2. `ds.call()` と `ds.cmd()` の呼び出しを記録する。
3. `Post.format()` 相当の `format()` を持つ軽量オブジェクトを使い、外部 API や実 Vim への依存を避ける。
4. `loadTimeline()` の主要な副作用を検証する。

## 追加するテスト案

- 空の投稿配列でも前処理と後処理が呼ばれること。
- 複数投稿の場合、投稿行の間にウィンドウ幅分の `-` セパレータが入ること。
- 複数行投稿の場合、`Post.format()` が返した行順が維持されること。
- `winwidth()` の戻り値が数値でない場合、`unknownutil.ensureNumber()` により失敗すること。

## 実装上の注意

- 本体コードの変更は最小限にする。
- まずは公開関数 `loadTimeline()` の振る舞いをテストする。
- private 関数のためだけの export 追加は避ける。
- 既存の `Deno.test` スタイルに合わせる。

## 検証

- `deno task test`
- 必要に応じて `sh scripts/test.sh`

## 実施結果

- `denops/dsky/ui/buffer_test.ts` を追加した。
- `loadTimeline()` の投稿書き込み、空配列時の処理、`winwidth()` 不正値時の失敗を検証した。
- `deno task test` が成功した。
- `sh scripts/test.sh` が成功した。
