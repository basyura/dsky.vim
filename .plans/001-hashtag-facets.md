# ハッシュタグ facets 対応実装計画

## Links

* 8c2b0df : Add hashtag facets support for posts

## 問題

Vim から `#tag` を投稿しても Bluesky Web 上でタグとして認識されない。

## 原因

AT Protocol では、ハッシュタグをリッチテキストとして認識させるために `facets` フィールドが必要。現在の実装（`denops/dsky/api/repo.ts`）では facets を付与していない。

```json
// 必要な形式
{
  "record": {
    "text": "Hello #bluesky",
    "facets": [
      {
        "index": { "byteStart": 6, "byteEnd": 14 },
        "features": [{ "$type": "app.bsky.richtext.facet#tag", "tag": "bluesky" }]
      }
    ]
  }
}
```

## 実装内容

### 1. 新規ファイル作成: `denops/dsky/api/facets.ts`

ハッシュタグ検出と facets 生成のユーティリティモジュール：

- `utf16IndexToUtf8Index()` - UTF-16 文字位置を UTF-8 バイト位置に変換
- `detectHashtags()` - テキストからハッシュタグを検出
- `createFacets()` - facets 配列を生成

### 2. 既存ファイル修正: `denops/dsky/api/repo.ts`

`post()` 関数を修正して facets を投稿に含める：

```typescript
const facetList = facets.createFacets(text);
const record = { text, createdAt, langs: ["ja"] };
if (facetList.length > 0) {
  record.facets = facetList;
}
```

## 修正ファイル一覧

| ファイル | 操作 |
|---------|------|
| `denops/dsky/api/facets.ts` | 新規作成 |
| `denops/dsky/api/repo.ts` | 修正（facets インポート・使用） |

## 検証方法

1. Vim で `:DSkySay` を実行し投稿バッファを開く
2. `テスト #hashtag` のようなテキストを投稿
3. Bluesky Web で投稿を確認し、`#hashtag` がクリック可能なリンクになっていることを確認

### テストケース

- 基本: `Hello #bluesky`
- 複数タグ: `#test1 #test2 hello`
- 日本語タグ: `こんにちは #日本語タグ です`
- 全角ハッシュ: `テスト ＃タグ`
