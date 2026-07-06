# debug.json 出力処理の集約計画

## 背景

`~/Desktop/debug.json` へ JSON を出力する処理が、現在は
`denops/dsky/api/feed.ts` と `denops/dsky/api/notification.ts` に
それぞれ `dump` 関数として重複している。

## 目的

`debug.json` へのファイル出力処理を 1 箇所にまとめ、今後の出力先や
フォーマット変更を共通箇所だけで扱えるようにする。

## 修正案

1. `denops/dsky/api/debug.ts` を追加する。
2. `debug.ts` に `writeDebugJson(ds, json)` を定義し、以下を担当させる。
   - `g:dsky_debug_enabled` の確認
   - `g:dsky_debug_enabled` が `0` の場合は何もしない
   - `~/Desktop/debug.json` の展開
   - 展開結果の文字列チェック
   - JSON の文字列化
   - `Deno.writeTextFile` による出力
3. `plugin/dsky.vim` に `g:dsky_debug_enabled` を定義し、
   デフォルトを `0` とする。
4. `feed.ts` と `notification.ts` のローカル `dump` 関数を削除し、
   共通関数を import して呼び出す。
5. 既存テストが通ることを確認し、必要に応じて共通関数の単体テストを
   追加する。

## 確認方法

`sh scripts/test.sh` を実行して、既存の Denops / Vim テストが
通ることを確認する。
