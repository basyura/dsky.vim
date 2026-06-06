# テストカバレッジ出力スキル追加計画

## 目的

このプロジェクトでテストコードカバレッジを安定して出力するための
プロジェクト固有 Codex スキルを追加する。特に `denops/dsky` の Deno
テストで `Missing transpiled source code` が出た場合に、`--reload` で
再実行する手順を明文化する。

## 修正案

1. 新しいプロジェクト固有スキル `test-coverage` を追加する。
   - 配置先はリポジトリ内の
     `.codex/skills/test-coverage/` とする。
   - 必須ファイル `SKILL.md` を作成する。

2. `SKILL.md` には以下を含める。
   - テストカバレッジを求められたときに使うスキルであること。
   - このプロジェクトでは `denops/dsky/deno.json` と
     `scripts/test.sh` を先に確認すること。
   - `denops/dsky` では `deno test --coverage=<dir>` を基本とすること。
   - `Missing transpiled source code` が出た場合は
     `deno test --reload --coverage=<dir>` を試すこと。
   - カバレッジ結果では、テスト成功数、集計対象ファイル、全体の
     Branch / Function / Line を簡潔に報告すること。

## 確認方法

- 作成した `SKILL.md` の frontmatter に `name` と `description` があること。
- 内容が簡潔で、実行手順と例外対応が分かること。
- このリポジトリで `denops/dsky` の Deno カバレッジ手順に合っていること。
- ユーザー共通の `/Users/tatsuya/.codex/skills/` には追加しないこと。
- 今回は `agents/openai.yaml` を追加しないこと。

## 注意点

- `.codex/skills/` は新規ディレクトリとして作成する。
- 具体的なスキルファイル編集は、この計画に沿って進める。
