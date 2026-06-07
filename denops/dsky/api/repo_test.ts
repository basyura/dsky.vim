import type { Denops } from "./../deps.ts";
import { createRecord } from "./repo.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, but got ${actualJson}`);
  }
}

function withDenoStubs<T>(fn: () => Promise<T>): Promise<T> {
  const originalEnvGet = Deno.env.get;
  const originalWriteTextFile = Deno.writeTextFile;

  Object.defineProperty(Deno.env, "get", {
    value: (key: string) => key === "HOME" ? "/tmp/home" : undefined,
  });
  Object.defineProperty(Deno, "writeTextFile", {
    value: () => Promise.resolve(),
  });

  return fn().finally(() => {
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

function createDenops(confirmChoice = 1): Denops {
  return {
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
    call: (name: string): unknown => {
      if (name === "confirm") {
        return confirmChoice;
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

Deno.test("createRecord returns true for empty text", async () => {
  assertEquals(await createRecord(createDenops(), ""), true);
});

Deno.test("createRecord posts text with facets", async () => {
  const bodies = new Array<unknown>();
  const responses = [
    Response.json(sessionJson()),
    Response.json({ uri: "at://post", cid: "post-cid" }),
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
        const ok = await createRecord(createDenops(), "hello #dsky");
        const body = bodies[1] as {
          repo: string;
          record: { text: string; facets: unknown[] };
        };

        assertEquals(ok, true);
        assertEquals(body.repo, "did:example:alice");
        assertEquals(body.record.text, "hello #dsky");
        assertEquals(body.record.facets.length, 1);
      },
    )
  );
});

Deno.test("createRecord reports API errors", async () => {
  const responses = [
    Response.json(sessionJson()),
    Response.json({ error: "BadRequest", message: "invalid text" }),
  ];

  await withDenoStubs(() =>
    withFetchStub(
      () => Promise.resolve(responses.shift() ?? Response.json({})),
      async () => {
        assertEquals(await createRecord(createDenops(), "hello"), false);
      },
    )
  );
});

Deno.test("createRecord cancels when external embed fails and user declines", async () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    await withDenoStubs(() =>
      withFetchStub(
        () => Promise.resolve(new Response("not found", { status: 404 })),
        async () => {
          assertEquals(
            await createRecord(
              createDenops(2),
              "see https://example.com/missing",
            ),
            false,
          );
        },
      )
    );
  } finally {
    console.error = originalError;
  }
});
