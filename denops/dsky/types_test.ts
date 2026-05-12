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
