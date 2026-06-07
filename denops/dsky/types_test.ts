import type { Denops } from "./deps.ts";
import { Post, Session } from "./types.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, but got ${actualJson}`);
  }
}

const ds = {
  call: (name: string, ...args: unknown[]): unknown => {
    if (name === "strwidth") {
      return String(args[0]).length;
    }
    if (name === "strpart") {
      return String(args[0]).slice(Number(args[1]), Number(args[2]));
    }
    throw new Error(`Unexpected function: ${name}`);
  },
} as unknown as Denops;

function createPost(displayName: unknown, handle: unknown): Post {
  return new Post(
    new Session({ did: "did:example:alice" }),
    {
      author: {
        displayName,
        handle,
      },
      record: {
        text: "hello",
        createdAt: "created",
      },
      uri: "at://example/post",
      cid: "cid",
    },
  );
}

Deno.test("Post.format uses handle when display name is empty", async () => {
  const post = createPost("", "alice.test");

  assertEquals(await post.format(ds), ["alice.test      hello - created"]);
});

Deno.test("Post.format uses placeholder when display name and handle are empty", async () => {
  const post = createPost("", "");

  assertEquals(await post.format(ds), ["*****           hello - created"]);
});

Deno.test("Post replaces link facets with canonical URIs", () => {
  const post = new Post(
    new Session({ did: "did:example:alice" }),
    {
      author: {
        displayName: "Alice",
        handle: "alice.test",
      },
      record: {
        text: "リンク https://bsky.app",
        createdAt: "created",
        facets: [{
          index: {
            byteStart: 10,
            byteEnd: 26,
          },
          features: [{
            $type: "app.bsky.richtext.facet#link",
            uri: "https://example.com/canonical",
          }],
        }],
      },
      uri: "at://example/post",
      cid: "cid",
      viewer: {
        like: "at://did:example:alice/like",
      },
    },
  );

  assertEquals(post.text, "リンク https://example.com/canonical");
  assertEquals(post.isLiked, true);
});

Deno.test("Post.format truncates long names and compacts blank lines", async () => {
  const post = new Post(
    new Session({ did: "did:example:alice" }),
    {
      author: {
        displayName: "very-long-display-name",
        handle: "alice.test",
      },
      record: {
        text: "first\n\n\nsecond",
        createdAt: "created",
      },
      uri: "at://example/post",
      cid: "cid",
    },
  );

  assertEquals(await post.format(ds), [
    "very-long-display-first",
    "　　　　　　　　 ",
    "　　　　　　　　second - created",
  ]);
});

Deno.test("Session creates an empty session from an empty array", () => {
  assertEquals(new Session([]), {
    did: "",
    handle: "",
    email: "",
    accessJwt: "",
    refreshJwt: "",
  });
});
