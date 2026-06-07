# denops 配下テスト網羅率 90% 以上対応計画

## 目的

`denops/dsky` 配下のソースコードに対するテストを追加し、Denops TypeScript
側のカバレッジを 90% 以上にする。

## 対象

- `denops/dsky/**/*.ts`
- 既存の `*_test.ts`
- カバレッジ計測は `denops/dsky` を基準に `deno test --coverage` で行う

## 修正案

1. `denops/dsky` 配下のソースファイルと既存テストを確認する。
2. 現在のテストとカバレッジを計測し、未網羅のファイルと分岐を特定する。
3. 副作用や外部通信を含む API 層は、依存関数を差し替えやすい単位を優先して
   テストする。
4. UI 層や型変換などの純粋な処理は、境界値と失敗系を含めてテストを追加する。
5. 必要最小限の実装調整でテスト可能性を上げる。ただし公開 API や Vim 連携の
   振る舞いは変更しない。
6. `deno test --coverage=/private/tmp/dsky-deno-coverage` を実行し、90% 以上を
   確認する。
7. 必要に応じて `sh scripts/test.sh` で既存の Vim script テストも含めて確認する。

## 完了条件

- `denops/dsky` 配下の主要ソースファイルに対応するテストが追加されている。
- Denops TypeScript 側の総合カバレッジが 90% 以上である。
- 追加したテストが成功する。
- 既存のユーザー向け挙動を変更していない。

## 実施結果

- `denops/dsky/api/*_test.ts` と `denops/dsky/main_test.ts` を追加した。
- `denops/dsky/types_test.ts` に `Post` と `Session` の追加ケースを実装した。
- `deno test --reload --coverage=/private/tmp/dsky-deno-coverage-final` で
  49 件成功を確認した。
- 総合カバレッジは Branch 92.7%、Function 98.4%、Line 95.0%。
- `sh scripts/test.sh` でも 49 件成功を確認した。
