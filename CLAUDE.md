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
  → api/proxy.ts (認証ヘッダー付与、トークン自動リフレッシュ)
  → api/server.ts (セッション管理)
```

## Development Commands

### プラグインのテスト
```vim
" プラグインマネージャーでこのリポジトリを読み込んでから
:DSkyTimeline            " タイムライン表示
:DSkyNotifications       " 通知一覧表示
:DSkySay                 " 投稿バッファを開く
:DSkyNewSession          " 新しいセッションを作成
:DSkyAuthorFeed <actor>  " 特定ユーザーのフィードを表示（ハンドル補完あり）
```

### バッファ内キーマッピング
- `<Leader><Leader>` - タイムラインをリロード
- `o` - 投稿内のURLを開く
- `u` - 投稿者のフィードを表示
- `<Leader>f` - 投稿にいいね

### 設定
```vim
let g:dsky_id = 'your_bluesky_id'
let g:dsky_password = 'your_app_password'
let g:dsky_author_len = 16        " 表示する著者名の長さ
let g:dsky_timeline_limit = 40    " タイムラインの取得件数
```

### セッション管理
- セッション情報: `~/.config/dsky/session.json` (Windows: `%LOCALAPPDATA%\dsky\session.json`)
- ハンドルキャッシュ: `~/.config/dsky/handles.txt`
- セッショントークンはExpiredToken時に`proxy.ts`が自動リフレッシュ

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
1. `consts.ts`にAPIエンドポイントURLを追加
2. `api/`以下に新しいモジュールを作成
3. `main.ts`のdispatcherに関数を登録
4. `autoload/dsky/api.vim`からDenops経由で呼び出し
5. 必要に応じて`plugin/dsky.vim`にコマンドを追加

## Important Notes

- AT ProtocolのAPIエンドポイントは`consts.ts`に集約
- 認証は`api/proxy.ts`で自動的にAuthorizationヘッダーに付与
- 自動テストはなし - 手動でVim上で動作確認
