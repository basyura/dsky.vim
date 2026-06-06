# URL 付き投稿のサイトカード埋め込み対応計画

## 問題

Vim から URL を含むメッセージを投稿しても、Bluesky 上でサイトカードとして
埋め込まれない。

## 原因

Bluesky の外部サイトカードは、投稿レコードの `embed` フィールドに
`app.bsky.embed.external` を設定する必要がある。現在の実装
（`denops/dsky/api/repo.ts`）では本文と facets のみを送信しており、
URL のメタ情報取得や external embed の付与を行っていない。

```json
{
  "record": {
    "text": "check https://example.com",
    "embed": {
      "$type": "app.bsky.embed.external",
      "external": {
        "uri": "https://example.com",
        "title": "Example Domain",
        "description": "Example description",
        "thumb": {
          "$type": "blob",
          "ref": { "$link": "..." },
          "mimeType": "image/png",
          "size": 12345
        }
      }
    }
  }
}
```

## 実装内容

### 1. URL 検出を追加

投稿本文から最初の `http://` または `https://` URL を検出する。
複数 URL が含まれる場合は、Bluesky の external embed が 1 件前提のため
最初の URL のみを埋め込み対象にする。

### 2. 外部カード作成モジュールを追加

新規ファイル `denops/dsky/api/embed.ts` を作成し、外部サイトカード生成を
担当させる。

- HTML を取得する
- `og:title`、`twitter:title`、`<title>` の順でタイトルを決定する
- `og:description`、`twitter:description`、`description` の順で説明を決定する
- `og:image`、`twitter:image` の順でサムネイル候補を決定する
- 相対 URL の画像は、元ページ URL から絶対 URL に解決する

### 3. サムネイル画像を uploadBlob する

`denops/dsky/consts.ts` に `com.atproto.repo.uploadBlob` の URL 定数を追加する。
`denops/dsky/api/proxy.ts` には Blob アップロード用の POST 関数を追加する。

- 画像の `Content-Type` は取得レスポンスの `content-type` を使う
- 画像サイズは Bluesky の制限に合わせて 1MB 以下のみアップロードする
- アップロード成功時は返却された `blob` を `external.thumb` に設定する
- 画像取得やアップロードに失敗した場合は `thumb` なしで続行する

### 4. 投稿レコードに embed を付与する

`denops/dsky/api/repo.ts` の `post()` 関数で external embed を作成し、
成功した場合のみ `record.embed` に設定する。既存の hashtag facets 付与は
維持する。

### 5. 埋め込み作成失敗時の確認を追加する

メタ情報取得などに失敗して external embed を作成できなかった場合は、
`fn.confirm()` でユーザーに確認する。

- 「本文だけ投稿する」を選んだ場合は `embed` なしで投稿する
- 「中止」を選んだ場合は投稿せず、投稿バッファを閉じない

## 修正ファイル一覧

| ファイル | 操作 |
|---------|------|
| `denops/dsky/api/embed.ts` | 新規作成 |
| `denops/dsky/api/repo.ts` | 修正（URL 検出・embed 付与・確認処理） |
| `denops/dsky/api/proxy.ts` | 修正（Blob アップロード用 POST 追加） |
| `denops/dsky/consts.ts` | 修正（uploadBlob URL 定数追加） |

## 検証方法

1. Vim で `:DSkySay` を実行し投稿バッファを開く
2. `https://example.com` を含むテキストを投稿する
3. Bluesky Web で投稿を確認し、サイトカードが表示されることを確認する
4. OG 画像がある URL で、サムネイルが表示されることを確認する
5. メタ情報取得に失敗する URL で、確認後に本文だけ投稿できることを確認する
6. 失敗時の確認で中止を選び、投稿されずバッファが残ることを確認する

### テストケース

- URL なし: `通常の投稿 #tag`
- URL あり: `読んだ https://example.com`
- 複数 URL: `a https://example.com b https://example.org`
- 日本語込み: `これはテスト https://example.com #日本語`
- OG 画像なし: `https://example.com`
- 存在しない URL: `https://invalid.example.invalid`

## 前提

- 対象 URL は `http` と `https` のみ。
- 自動埋め込み対象は投稿本文中の最初の URL のみ。
- 新しい外部 HTML パーサ依存は追加せず、必要な meta/title タグだけを抽出する。
