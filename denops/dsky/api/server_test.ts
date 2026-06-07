import type { Denops } from "./../deps.ts";
import { getSession, newSession } from "./server.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, but got ${actualJson}`);
  }
}

function withDenoStubs<T>(
  stubs: {
    stat?: typeof Deno.stat;
    readTextFile?: typeof Deno.readTextFile;
    writeTextFile?: typeof Deno.writeTextFile;
    envGet?: typeof Deno.env.get;
  },
  fn: () => Promise<T>,
): Promise<T> {
  const originalStat = Deno.stat;
  const originalReadTextFile = Deno.readTextFile;
  const originalWriteTextFile = Deno.writeTextFile;
  const originalEnvGet = Deno.env.get;

  if (stubs.stat != null) {
    Object.defineProperty(Deno, "stat", { value: stubs.stat });
  }
  if (stubs.readTextFile != null) {
    Object.defineProperty(Deno, "readTextFile", { value: stubs.readTextFile });
  }
  if (stubs.writeTextFile != null) {
    Object.defineProperty(Deno, "writeTextFile", {
      value: stubs.writeTextFile,
    });
  }
  if (stubs.envGet != null) {
    Object.defineProperty(Deno.env, "get", { value: stubs.envGet });
  }

  return fn().finally(() => {
    Object.defineProperty(Deno, "stat", { value: originalStat });
    Object.defineProperty(Deno, "readTextFile", {
      value: originalReadTextFile,
    });
    Object.defineProperty(Deno, "writeTextFile", {
      value: originalWriteTextFile,
    });
    Object.defineProperty(Deno.env, "get", { value: originalEnvGet });
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
    eval: (_expr: string, ctx: { n: string }): unknown => {
      if (ctx.n === "g:dsky_id") {
        return "alice.test";
      }
      if (ctx.n === "g:dsky_password") {
        return "secret";
      }

      throw new Error(`Unexpected variable: ${ctx.n}`);
    },
  } as unknown as Denops;
}

Deno.test("getSession loads an existing session file", async () => {
  await withDenoStubs(
    {
      envGet: (key: string) => key === "HOME" ? "/tmp/home" : undefined,
      stat: () => Promise.resolve({} as Deno.FileInfo),
      readTextFile: () =>
        Promise.resolve(JSON.stringify({
          did: "did:example:alice",
          handle: "alice.test",
          email: "alice@example.com",
          accessJwt: "access",
          refreshJwt: "refresh",
        })),
    },
    async () => {
      const session = await getSession(createDenops());

      assertEquals(session.did, "did:example:alice");
      assertEquals(session.handle, "alice.test");
      assertEquals(session.accessJwt, "access");
    },
  );
});

Deno.test("newSession posts credentials and stores the response", async () => {
  const writes = new Array<{ path: string; data: string }>();

  await withDenoStubs(
    {
      envGet: (key: string) => key === "HOME" ? "/tmp/home" : undefined,
      writeTextFile: (
        path: string | URL,
        data: string | ReadableStream<string>,
      ) => {
        writes.push({ path: String(path), data: String(data) });
        return Promise.resolve();
      },
    },
    () =>
      withFetchStub(
        (input: string | URL | Request, init?: RequestInit) => {
          assertEquals(
            String(input),
            "https://bsky.social/xrpc/com.atproto.server.createSession",
          );
          assertEquals(init?.method, "POST");
          assertEquals(
            init?.body,
            '{"identifier": "alice.test", "password":"secret"}',
          );
          return Promise.resolve(
            Response.json({
              did: "did:example:alice",
              handle: "alice.test",
              email: "alice@example.com",
              accessJwt: "access",
              refreshJwt: "refresh",
            }),
          );
        },
        async () => {
          const session = await newSession(createDenops());

          assertEquals(session.did, "did:example:alice");
          assertEquals(writes[0].path, "/tmp/home/.config/dsky/session.json");
          assertEquals(JSON.parse(writes[0].data).refreshJwt, "refresh");
        },
      ),
  );
});
