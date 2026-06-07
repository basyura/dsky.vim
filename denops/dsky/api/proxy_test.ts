import type { Denops } from "./../deps.ts";
import { get, post, uploadBlob } from "./proxy.ts";

type FetchCall = {
  input: string;
  init?: RequestInit;
};

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

function createDenops(commands: string[] = []): Denops {
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
    cmd: (cmd: string): void => {
      commands.push(cmd);
    },
  } as unknown as Denops;
}

function sessionResponse(accessJwt: string): Response {
  return Response.json({
    did: "did:example:alice",
    handle: "alice.test",
    email: "alice@example.com",
    accessJwt,
    refreshJwt: "refresh",
  });
}

Deno.test("get retries with a new session when token expired", async () => {
  const calls = new Array<FetchCall>();

  await withDenoStubs(() =>
    withFetchStub(
      (input: string | URL | Request, init?: RequestInit) => {
        calls.push({ input: String(input), init });
        if (calls.length === 1) {
          return Promise.resolve(sessionResponse("old-token"));
        }
        if (calls.length === 2) {
          return Promise.resolve(
            Response.json({ error: "ExpiredToken" }, { status: 401 }),
          );
        }
        if (calls.length === 3) {
          return Promise.resolve(sessionResponse("new-token"));
        }
        return Promise.resolve(Response.json({ ok: true }));
      },
      async () => {
        const res = await get(createDenops(), "https://example.com/xrpc");
        const json = await res.json();

        assertEquals(json.ok, true);
        assertEquals(res.session.accessJwt, "new-token");
        assertEquals(calls.map((call) => call.input), [
          "https://bsky.social/xrpc/com.atproto.server.createSession",
          "https://example.com/xrpc",
          "https://bsky.social/xrpc/com.atproto.server.createSession",
          "https://example.com/xrpc",
        ]);
        assertEquals(
          calls[3].init?.headers,
          {
            "Content-Type": "application/json",
            Authorization: "Bearer new-token",
          },
        );
      },
    )
  );
});

Deno.test("get returns an empty response when fetch throws", async () => {
  await withDenoStubs(() =>
    withFetchStub(
      () => Promise.reject(new Error("network down")),
      async () => {
        const commands = new Array<string>();
        const res = await get(
          createDenops(commands),
          "https://example.com/xrpc",
        );

        assertEquals(res.status, 200);
        assertEquals(res.session.did, "");
        assertEquals(commands.length, 1);
      },
    )
  );
});

Deno.test("get reports non-expired request errors", async () => {
  const responses = [
    sessionResponse("access"),
    Response.json(
      { error: "BadRequest" },
      { status: 400, statusText: "Bad Request" },
    ),
  ];

  await withDenoStubs(() =>
    withFetchStub(
      () => Promise.resolve(responses.shift() ?? Response.json({})),
      async () => {
        const commands = new Array<string>();
        const res = await get(
          createDenops(commands),
          "https://example.com/xrpc",
        );

        assertEquals(res.status, 400);
        assertEquals(res.session.accessJwt, "access");
        assertEquals(commands.length, 1);
      },
    )
  );
});

Deno.test("post replaces session did in payload", async () => {
  const calls = new Array<FetchCall>();

  await withDenoStubs(() =>
    withFetchStub(
      (input: string | URL | Request, init?: RequestInit) => {
        calls.push({ input: String(input), init });
        if (calls.length === 1) {
          return Promise.resolve(sessionResponse("access"));
        }
        return Promise.resolve(Response.json({ ok: true }));
      },
      async () => {
        const res = await post(
          createDenops(),
          "https://example.com/post",
          '{"repo":"$SESSION_DID"}',
        );

        assertEquals(await res.json(), { ok: true });
        assertEquals(res.session.did, "did:example:alice");
        assertEquals(calls[1].init?.body, '{"repo":"did:example:alice"}');
      },
    )
  );
});

Deno.test("post keeps failed responses with session", async () => {
  const responses = [
    sessionResponse("access"),
    Response.json({ error: "BadRequest" }, { status: 400 }),
  ];
  const originalLog = console.log;
  console.log = () => {};

  try {
    await withDenoStubs(() =>
      withFetchStub(
        () => Promise.resolve(responses.shift() ?? Response.json({})),
        async () => {
          const res = await post(
            createDenops(),
            "https://example.com/post",
            "{}",
          );

          assertEquals(res.status, 400);
          assertEquals(res.session.accessJwt, "access");
        },
      )
    );
  } finally {
    console.log = originalLog;
  }
});

Deno.test("uploadBlob sends image content type", async () => {
  const calls = new Array<FetchCall>();

  await withDenoStubs(() =>
    withFetchStub(
      (input: string | URL | Request, init?: RequestInit) => {
        calls.push({ input: String(input), init });
        if (calls.length === 1) {
          return Promise.resolve(sessionResponse("access"));
        }
        return Promise.resolve(Response.json({ blob: { ref: "blob-ref" } }));
      },
      async () => {
        const blob = new Blob(["image"], { type: "image/png" });
        const res = await uploadBlob(createDenops(), blob, "image/png");

        assertEquals(await res.json(), { blob: { ref: "blob-ref" } });
        assertEquals(
          calls[1].input,
          "https://bsky.social/xrpc/com.atproto.repo.uploadBlob",
        );
        assertEquals(
          calls[1].init?.headers,
          {
            "Content-Type": "image/png",
            Authorization: "Bearer access",
          },
        );
      },
    )
  );
});

Deno.test("uploadBlob keeps failed responses with session", async () => {
  const responses = [
    sessionResponse("access"),
    Response.json({ error: "UploadFailed" }, { status: 500 }),
  ];
  const originalLog = console.log;
  console.log = () => {};

  try {
    await withDenoStubs(() =>
      withFetchStub(
        () => Promise.resolve(responses.shift() ?? Response.json({})),
        async () => {
          const blob = new Blob(["image"], { type: "image/png" });
          const res = await uploadBlob(createDenops(), blob, "image/png");

          assertEquals(res.status, 500);
          assertEquals(res.session.accessJwt, "access");
        },
      )
    );
  } finally {
    console.log = originalLog;
  }
});
