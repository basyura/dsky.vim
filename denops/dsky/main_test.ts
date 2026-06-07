import type { Denops } from "./deps.ts";
import { main } from "./main.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, but got ${actualJson}`);
  }
}

function assertRejects(fn: () => Promise<unknown>): Promise<void> {
  return fn().then(
    () => {
      throw new Error("Expected function to reject");
    },
    () => undefined,
  );
}

function withDenoStubs<T>(
  stat: typeof Deno.stat,
  fn: () => Promise<T>,
): Promise<T> {
  const originalStat = Deno.stat;
  const originalEnvGet = Deno.env.get;

  Object.defineProperty(Deno, "stat", { value: stat });
  Object.defineProperty(Deno.env, "get", {
    value: (key: string) => key === "HOME" ? "/tmp/home" : undefined,
  });

  return fn().finally(() => {
    Object.defineProperty(Deno, "stat", { value: originalStat });
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

Deno.test("main creates config dir when missing and registers dispatcher", async () => {
  const calls = new Array<{ name: string; args: unknown[] }>();
  const originalLog = console.log;
  console.log = () => {};
  const ds = {
    call: (name: string, ...args: unknown[]): unknown => {
      calls.push({ name, args });
      return undefined;
    },
  } as unknown as Denops;

  try {
    await withDenoStubs(
      () => Promise.reject(new Error("missing")),
      async () => {
        await main(ds);

        assertEquals(calls, [{
          name: "mkdir",
          args: ["/tmp/home/.config/dsky", "p"],
        }]);
        assertEquals(typeof ds.dispatcher.createRecord, "function");
        assertEquals(typeof ds.dispatcher.getTimeline, "function");
        assertEquals(typeof ds.dispatcher.getHandles, "function");
      },
    );
  } finally {
    console.log = originalLog;
  }
});

Deno.test("main skips mkdir when config dir exists", async () => {
  const calls = new Array<{ name: string; args: unknown[] }>();
  const ds = {
    call: (name: string, ...args: unknown[]): unknown => {
      calls.push({ name, args });
      return undefined;
    },
  } as unknown as Denops;

  await withDenoStubs(
    () => Promise.resolve({} as Deno.FileInfo),
    async () => {
      await main(ds);

      assertEquals(calls, []);
      assertEquals(typeof ds.dispatcher.newSession, "function");
    },
  );
});

Deno.test("dispatcher methods validate arguments and call implementations", async () => {
  const writes = new Array<string>();
  const responses = [
    Response.json({
      did: "did:example:alice",
      handle: "alice.test",
      email: "alice@example.com",
      accessJwt: "access",
      refreshJwt: "refresh",
    }),
    Response.json({ notifications: [] }),
    Response.json({
      did: "did:example:alice",
      handle: "alice.test",
      email: "alice@example.com",
      accessJwt: "access-2",
      refreshJwt: "refresh-2",
    }),
  ];
  const originalWriteTextFile = Deno.writeTextFile;
  const originalLog = console.log;
  Object.defineProperty(Deno, "writeTextFile", {
    value: (_path: string | URL, data: string | ReadableStream<string>) => {
      writes.push(String(data));
      return Promise.resolve();
    },
  });
  console.log = () => {};

  const ds = {
    meta: { mode: "test", host: "nvim" },
    eval: (_expr: string, ctx: { n: string }): unknown => {
      if (ctx.n === "g:dsky_id") {
        return "alice.test";
      }
      if (ctx.n === "g:dsky_password") {
        return "secret";
      }
      throw new Error(`Unexpected variable: ${ctx.n}`);
    },
    call: (name: string, arg: unknown): unknown => {
      if (name === "expand" && arg === "~/Desktop/debug.json") {
        return "/tmp/debug.json";
      }
      return undefined;
    },
    cmd: () => {},
  } as unknown as Denops;

  try {
    await withDenoStubs(
      () => Promise.reject(new Error("missing")),
      () =>
        withFetchStub(
          () => Promise.resolve(responses.shift() ?? Response.json({})),
          async () => {
            await main(ds);
            const dispatcher = ds.dispatcher as Record<
              string,
              (...args: unknown[]) => Promise<unknown>
            >;

            assertEquals(await dispatcher.createRecord(""), true);
            await assertRejects(() => dispatcher.getTimeline("20"));
            await assertRejects(() => dispatcher.getAuthorFeed(1));
            await assertRejects(() => dispatcher.like("uri", 1));
            assertEquals(await dispatcher.listNotifications(), []);
            assertEquals(await dispatcher.getHandles(), []);
            assertEquals(
              (await dispatcher.newSession() as { accessJwt: string })
                .accessJwt,
              "access-2",
            );
            assertEquals(writes.length >= 2, true);
          },
        ),
    );
  } finally {
    Object.defineProperty(Deno, "writeTextFile", {
      value: originalWriteTextFile,
    });
    console.log = originalLog;
  }
});
