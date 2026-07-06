import type { Denops } from "./../deps.ts";
import { getAuthorFeed, getTimeline, like } from "./feed.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, but got ${actualJson}`);
  }
}

function withDenoStubs<T>(fn: () => Promise<T>): Promise<T> {
  const originalStat = Deno.stat;
  const originalEnvGet = Deno.env.get;
  const originalWriteTextFile = Deno.writeTextFile;

  Object.defineProperty(Deno, "stat", {
    value: () => Promise.reject(new Error("missing")),
  });
  Object.defineProperty(Deno.env, "get", {
    value: (key: string) => key === "HOME" ? "/tmp/home" : undefined,
  });
  Object.defineProperty(Deno, "writeTextFile", {
    value: () => Promise.resolve(),
  });

  return fn().finally(() => {
    Object.defineProperty(Deno, "stat", { value: originalStat });
    Object.defineProperty(Deno.env, "get", { value: originalEnvGet });
    Object.defineProperty(Deno, "writeTextFile", {
      value: originalWriteTextFile,
    });
  });
}

function withFetchStub<T>(
  stub: typeof fetch,
  fn: () => Promise<T>,
): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = stub;
  return fn().finally(() => {
    globalThis.fetch = originalFetch;
  });
}

function createDenops(): Denops {
  return {
    meta: { mode: "test", host: "nvim" },
    eval: (_expr: string, ctx: { n: string }): unknown => {
      if (ctx.n === "g:dsky_id") {
        return "alice.test";
      }
      if (ctx.n === "g:dsky_password") {
        return "secret";
      }
      if (ctx.n === "g:dsky_debug_enabled") {
        return 0;
      }
      throw new Error(`Unexpected variable: ${ctx.n}`);
    },
    cmd: () => {},
  } as unknown as Denops;
}

function sessionJson() {
  return {
    did: "did:example:alice",
    handle: "alice.test",
    email: "alice@example.com",
    accessJwt: "access",
    refreshJwt: "refresh",
  };
}

function feedPost(handle: string, did = `did:example:${handle}`) {
  return {
    post: {
      author: { displayName: handle, handle, did },
      record: { text: `hello ${handle}`, createdAt: "created" },
      uri: `at://${handle}/post`,
      cid: `cid-${handle}`,
    },
  };
}

Deno.test("getTimeline filters replies to other authors and saves handles", async () => {
  const responses = [
    Response.json(sessionJson()),
    Response.json({
      feed: [
        feedPost("alice.test", "did:example:alice"),
        {
          ...feedPost("bob.test", "did:example:bob"),
          reply: { root: { author: { did: "did:example:other" } } },
        },
        {
          ...feedPost("carol.test", "did:example:carol"),
          reply: { root: { author: { did: "did:example:carol" } } },
        },
      ],
    }),
  ];

  await withDenoStubs(() =>
    withFetchStub(
      () => Promise.resolve(responses.shift() ?? Response.json({})),
      async () => {
        const posts = await getTimeline(createDenops(), 20);

        assertEquals(posts.map((post) => post.handle), [
          "alice.test",
          "carol.test",
        ]);
      },
    )
  );
});

Deno.test("getAuthorFeed returns all author feed posts", async () => {
  const responses = [
    Response.json(sessionJson()),
    Response.json({ feed: [feedPost("alice.test"), feedPost("bob.test")] }),
  ];

  await withDenoStubs(() =>
    withFetchStub(
      () => Promise.resolve(responses.shift() ?? Response.json({})),
      async () => {
        const posts = await getAuthorFeed(createDenops(), "alice.test");

        assertEquals(posts.map((post) => post.handle), [
          "alice.test",
          "bob.test",
        ]);
      },
    )
  );
});

Deno.test("like posts a like record with session did", async () => {
  const bodies = new Array<unknown>();
  const responses = [
    Response.json(sessionJson()),
    Response.json({ uri: "at://like", cid: "like-cid" }),
  ];

  await withDenoStubs(() =>
    withFetchStub(
      (_input: string | URL | Request, init?: RequestInit) => {
        if (init?.body != null) {
          bodies.push(JSON.parse(String(init.body)));
        }
        return Promise.resolve(responses.shift() ?? Response.json({}));
      },
      async () => {
        const json = await like(
          createDenops(),
          "at://post",
          "post-cid",
        ) as unknown as { status: number };

        assertEquals(json.status, 200);
        assertEquals((bodies[1] as { repo: string }).repo, "did:example:alice");
      },
    )
  );
});
