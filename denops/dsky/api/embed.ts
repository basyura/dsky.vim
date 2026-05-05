// https://docs.bsky.app/docs/advanced-guides/posts
import { Denops } from "./../deps.ts";
import * as proxy from "./proxy.ts";

const MAX_THUMB_SIZE = 1_000_000;

interface ExternalEmbed {
  $type: "app.bsky.embed.external";
  external: {
    uri: string;
    title: string;
    description: string;
    thumb?: unknown;
  };
}

interface Metadata {
  title: string;
  description: string;
  image?: string;
}

export function detectFirstUrl(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s<>"']+/u);
  if (match == null) {
    return undefined;
  }

  return match[0].replace(/[),.。、!?！？]+$/u, "");
}

export async function createExternalEmbed(
  ds: Denops,
  uri: string,
): Promise<ExternalEmbed | undefined> {
  try {
    const metadata = await fetchMetadata(uri);
    const external: ExternalEmbed["external"] = {
      uri,
      title: metadata.title,
      description: metadata.description,
    };

    if (metadata.image != null) {
      const thumb = await fetchThumb(ds, metadata.image);
      if (thumb != null) {
        external.thumb = thumb;
      }
    }

    return {
      $type: "app.bsky.embed.external",
      external,
    };
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

async function fetchMetadata(uri: string): Promise<Metadata> {
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`failed to fetch metadata: ${res.status}`);
  }

  const html = await res.text();
  return {
    title: firstNonEmpty([
      findMetaContent(html, "property", "og:title"),
      findMetaContent(html, "name", "twitter:title"),
      findTitle(html),
    ]),
    description: firstNonEmpty([
      findMetaContent(html, "property", "og:description"),
      findMetaContent(html, "name", "twitter:description"),
      findMetaContent(html, "name", "description"),
    ]),
    image: resolveUrl(
      firstNonEmpty([
        findMetaContent(html, "property", "og:image"),
        findMetaContent(html, "name", "twitter:image"),
      ]),
      uri,
    ),
  };
}

async function fetchThumb(ds: Denops, uri: string): Promise<unknown> {
  try {
    const res = await fetch(uri);
    if (!res.ok) {
      return undefined;
    }

    const blob = await res.blob();
    if (blob.size > MAX_THUMB_SIZE) {
      return undefined;
    }

    const mimeType = res.headers.get("content-type") ?? blob.type;
    if (!mimeType.startsWith("image/")) {
      return undefined;
    }

    const uploadRes = await proxy.uploadBlob(ds, blob, mimeType);
    if (!uploadRes.ok) {
      return undefined;
    }

    const json = await uploadRes.json();
    return json.blob;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

function findMetaContent(
  html: string,
  attrName: "name" | "property",
  attrValue: string,
): string {
  const metaPattern = new RegExp(
    `<meta\\s+[^>]*${attrName}=["']${escapeRegExp(attrValue)}["'][^>]*>`,
    "iu",
  );
  const match = html.match(metaPattern);
  if (match == null) {
    return "";
  }

  return decodeHtml(readAttribute(match[0], "content"));
}

function findTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/iu);
  if (match == null) {
    return "";
  }

  return decodeHtml(match[1].replace(/\s+/g, " ").trim());
}

function readAttribute(tag: string, name: string): string {
  const attrPattern = new RegExp(`${name}=["']([^"']*)["']`, "iu");
  const match = tag.match(attrPattern);
  if (match == null) {
    return "";
  }

  return match[1].trim();
}

function firstNonEmpty(values: string[]): string {
  for (const value of values) {
    if (value !== "") {
      return value;
    }
  }

  return "";
}

function resolveUrl(value: string, base: string): string | undefined {
  if (value === "") {
    return undefined;
  }

  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
