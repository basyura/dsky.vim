import { createFacets } from "./facets.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, but got ${actualJson}`);
  }
}

Deno.test("createFacets creates a link facet", () => {
  assertEquals(createFacets("see https://example.com"), [
    {
      index: {
        byteStart: 4,
        byteEnd: 23,
      },
      features: [
        {
          $type: "app.bsky.richtext.facet#link",
          uri: "https://example.com",
        },
      ],
    },
  ]);
});

Deno.test("createFacets creates hashtag facets", () => {
  assertEquals(createFacets("#tag ＃青空"), [
    {
      index: {
        byteStart: 0,
        byteEnd: 4,
      },
      features: [
        {
          $type: "app.bsky.richtext.facet#tag",
          tag: "tag",
        },
      ],
    },
    {
      index: {
        byteStart: 5,
        byteEnd: 14,
      },
      features: [
        {
          $type: "app.bsky.richtext.facet#tag",
          tag: "青空",
        },
      ],
    },
  ]);
});

Deno.test("createFacets uses UTF-8 byte indexes", () => {
  assertEquals(createFacets("こんにちは #青空"), [
    {
      index: {
        byteStart: 16,
        byteEnd: 23,
      },
      features: [
        {
          $type: "app.bsky.richtext.facet#tag",
          tag: "青空",
        },
      ],
    },
  ]);
});

Deno.test("createFacets ignores hashtags inside links", () => {
  assertEquals(createFacets("see https://example.com/#anchor"), [
    {
      index: {
        byteStart: 4,
        byteEnd: 31,
      },
      features: [
        {
          $type: "app.bsky.richtext.facet#link",
          uri: "https://example.com/#anchor",
        },
      ],
    },
  ]);
});

Deno.test("createFacets trims trailing punctuation from links", () => {
  assertEquals(createFacets("see https://example.com/test。"), [
    {
      index: {
        byteStart: 4,
        byteEnd: 28,
      },
      features: [
        {
          $type: "app.bsky.richtext.facet#link",
          uri: "https://example.com/test",
        },
      ],
    },
  ]);
});
