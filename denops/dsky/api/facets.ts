// Facets utility for AT Protocol rich text
// https://docs.bsky.app/docs/advanced-guides/post-richtext

const encoder = new TextEncoder();

interface HashtagMatch {
  tag: string;
  start: number;
  end: number;
}

interface LinkMatch {
  uri: string;
  start: number;
  end: number;
}

interface Facet {
  index: {
    byteStart: number;
    byteEnd: number;
  };
  features: Array<
    | {
      $type: "app.bsky.richtext.facet#tag";
      tag: string;
    }
    | {
      $type: "app.bsky.richtext.facet#link";
      uri: string;
    }
  >;
}

/**
 * Convert UTF-16 string index to UTF-8 byte index
 */
function utf16IndexToUtf8Index(text: string, utf16Index: number): number {
  return encoder.encode(text.slice(0, utf16Index)).byteLength;
}

/**
 * Detect hashtags in text
 * Pattern based on syntax/dsky.vim: [#＃]\S+
 */
function detectHashtags(text: string): HashtagMatch[] {
  const results: HashtagMatch[] = [];

  // Match hashtags: #tag or ＃tag (fullwidth)
  // Hashtag must not start with a digit
  const regex = /[#＃]([^\s#＃\d][^\s#＃]*)/gu;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const tag = match[1];
    const start = match.index;
    const end = start + match[0].length;

    results.push({ tag, start, end });
  }

  return results;
}

function detectLinks(text: string): LinkMatch[] {
  const results: LinkMatch[] = [];
  const regex = /https?:\/\/[^\s<>"']+/gu;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const uri = match[0].replace(/[),.。、!?！？]+$/u, "");
    const start = match.index;
    const end = start + uri.length;

    results.push({ uri, start, end });
  }

  return results;
}

/**
 * Create facets array from text
 */
export function createFacets(text: string): Facet[] {
  const links = detectLinks(text);
  const hashtags = detectHashtags(text).filter((ht) =>
    !links.some((link) => overlaps(ht.start, ht.end, link.start, link.end))
  );

  return [
    ...links.map((link) => ({
      index: {
        byteStart: utf16IndexToUtf8Index(text, link.start),
        byteEnd: utf16IndexToUtf8Index(text, link.end),
      },
      features: [
        {
          $type: "app.bsky.richtext.facet#link" as const,
          uri: link.uri,
        },
      ],
    })),
    ...hashtags.map((ht) => ({
      index: {
        byteStart: utf16IndexToUtf8Index(text, ht.start),
        byteEnd: utf16IndexToUtf8Index(text, ht.end),
      },
      features: [
        {
          $type: "app.bsky.richtext.facet#tag" as const,
          tag: ht.tag,
        },
      ],
    })),
  ];
}

function overlaps(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): boolean {
  return start1 < end2 && start2 < end1;
}
