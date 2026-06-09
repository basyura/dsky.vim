# autoload Vim テスト追加計画

## 目的

`autoload` フォルダ配下の Vim script ソースに対して、Vim 標準の
`assert_*()` を使ったテストコードを追加する。

## 対象

- `autoload/dsky.vim`
- `autoload/dsky/api.vim`
- `autoload/dsky/buffer.vim`
- `autoload/dsky/handle.vim`
- `autoload/dsky/say.vim`
- `autoload/dsky/util/str.vim`

## 方針

- 既存の `tests/vim/*.vim` と同じ形式を使う。
- 外部テスティングフレームワークは追加しない。
- 各テストは `vim -Nu NONE -n -es -S tests/vim/xxx_test.vim` で実行できる形にする。
- `scripts/test.sh` に追加テストを組み込む。
- Denops 呼び出しなど外部依存が強い処理は、Vim script 側で検証できる範囲に絞る。

## 修正案

1. `autoload` 配下の関数と依存関係を確認する。
2. 未テストの Vim script ソースに対応する `tests/vim/*_test.vim` を追加する。
3. 既存テストで足りるファイルは必要に応じてケースを補強する。
4. `scripts/test.sh` に追加した Vim テストを追記する。
5. `sh scripts/test.sh` を実行して全テストを確認する。

## 確認事項

- 既存テストの命名規則と実行方式に合わせる。
- テストでグローバル状態やバッファ状態を変更する場合は、各テスト内で初期化する。
- 実装変更は原則行わず、テスト追加に限定する。

## 実施結果

- `tests/vim/fixtures/autoload/denops.vim` を追加し、Denops 呼び出しをスタブ化した。
- `tests/vim/api_test.vim` を追加した。
- `tests/vim/handle_test.vim` を追加した。
- `tests/vim/say_test.vim` を追加した。
- `tests/vim/dsky_test.vim` を追加した。
- `scripts/test.sh` に追加した Vim テストを組み込んだ。
- `sh scripts/test.sh` で全テストの成功を確認した。
