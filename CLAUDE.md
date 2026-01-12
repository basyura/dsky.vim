# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

dsky.vimは、Bluesky (AT Protocol) APIと連携するためのVim/Neovimプラグインです。Denopsを使用してTypeScript (Deno)でAPIロジックを実装し、Vim scriptでUIとコマンドを提供します。

## Architecture

### 二層構造
1. **Vim script層** (`plugin/`, `autoload/`, `syntax/`)
   - エントリーポイント: `plugin/dsky.vim`でコマンドとマッピングを定義
   - ランタイムヘルパー: `autoload/dsky/`以下に機能別の関数を配置
   - シンタックスハイライト: `syntax/dsky.vim`

2. **Denops層** (`denops/dsky/`)
   - エントリーポイント: `main.ts`がDenopsのディスパッチャーを定義
   - APIモジュール: `api/`以下にBluesky APIとの通信ロジック
   - UI/バッファ処理: `ui/buffer.ts`
   - 共有定義: `types.ts`, `consts.ts`

### データフロー
```
Vim command (:DSkyTimeline)
  → autoload/dsky.vim
  → denops#request('dsky', 'getTimeline', [...])
  → denops/dsky/main.ts dispatcher
  → api/feed.ts (API呼び出し)
  → api/proxy.ts (認証ヘッダー付与)
  → api/server.ts (セッション管理)
```

## Development Commands

### プラグインのテスト
```vim
" プラグインマネージャーでこのリポジトリを読み込んでから
:DSkyTimeline        " タイムライン表示
:DSkyNotifications   " 通知一覧表示
:DSkySay            " 投稿バッファを開く
:DSkyNewSession     " 新しいセッションを作成
:DSkyAuthorFeed <actor>  " 特定ユーザーのフィードを表示
```

### 設定
```vim
" .vimrc / init.vim で設定
let g:dsky_id = 'your_bluesky_id'
let g:dsky_password = 'your_app_password'
let g:dsky_author_len = 16        " 表示する著者名の長さ
let g:dsky_timeline_limit = 40    " タイムラインの取得件数
```

### セッション管理
- セッション情報は`api/path.ts`の`getConfigDir()`で決定されるディレクトリに保存されます
- Windowsの場合: `~\AppData\Local\dsky\session.json`
- macOS/Linuxの場合: `~/.config/dsky/session.json`

## Coding Conventions

### Vim script
- 2スペースインデント
- `plugin/`にコマンド定義、`autoload/`に実装を分離
- グローバル変数は`g:dsky_`プレフィックスを使用

### TypeScript
- 2スペースインデント、セミコロンあり
- 機能ごとにモジュール分割 (例: `api/feed.ts`, `api/notification.ts`)
- Denopsは非同期処理が基本なので、ブロッキング呼び出しを避ける
- `unknownutil`を使用して型安全性を確保

### API実装パターン
新しいAPI機能を追加する場合:
1. `api/`以下に新しいモジュールを作成
2. `consts.ts`にAPIエンドポイントURLを追加
3. `main.ts`のdispatcherに関数を登録
4. `autoload/dsky/`または`autoload/dsky/api.vim`からDenops経由で呼び出し
5. 必要に応じて`plugin/dsky.vim`にコマンドを追加

## Important Notes

- AT ProtocolのAPIエンドポイントは`consts.ts`に集約されています
- 認証は`api/proxy.ts`で自動的にAuthorizationヘッダーに付与されます
- セッショントークンの有効期限が切れた場合は`:DSkyNewSession`で再認証が必要です
- 投稿本文のエスケープ処理は`autoload/dsky/util/str.vim`を参照してください
