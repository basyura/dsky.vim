import type { Denops } from "./../deps.ts";
import { listNotifications } from "./notification.ts";

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
    call: (name: string, arg: unknown): unknown => {
      if (name === "expand" && arg === "~/Desktop/debug.json") {
        return "/tmp/debug.json";
      }
      throw new Error(`Unexpected function: ${name}`);
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

Deno.test("listNotifications returns only reply notifications", async () => {
  const responses = [
    Response.json(sessionJson()),
    Response.json({
      notifications: [
        {
          reason: "like",
          author: { displayName: "Like", handle: "like.test" },
          record: { text: "liked", createdAt: "created" },
          uri: "at://like",
          cid: "like-cid",
        },
        {
          reason: "reply",
          author: { displayName: "Reply", handle: "reply.test" },
          record: { text: "reply", createdAt: "created" },
          uri: "at://reply",
          cid: "reply-cid",
        },
      ],
    }),
  ];

  await withDenoStubs(() =>
    withFetchStub(
      () => Promise.resolve(responses.shift() ?? Response.json({})),
      async () => {
        const posts = await listNotifications(createDenops());

        assertEquals(posts.map((post) => post.handle), ["reply.test"]);
      },
    )
  );
});
