import type { Denops } from "./../deps.ts";
import { createExternalEmbed, detectFirstUrl } from "./embed.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, but got ${actualJson}`);
  }
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

Deno.test("detectFirstUrl trims trailing punctuation", () => {
  assertEquals(
    detectFirstUrl("see https://example.com/path?q=1。"),
    "https://example.com/path?q=1",
  );
});

Deno.test("detectFirstUrl returns undefined without URL", () => {
  assertEquals(detectFirstUrl("no link here"), undefined);
});

Deno.test("createExternalEmbed reads metadata and resolves relative image URL", async () => {
  const html = `
    <html>
      <head>
        <meta property="og:title" content="A &amp; B">
        <meta name="description" content="Description &lt;text&gt;">
      </head>
    </html>
  `;

  await withFetchStub(
    (input: string | URL | Request) => {
      assertEquals(String(input), "https://example.com/article");
      return Promise.resolve(
        new Response(html, {
          headers: { "content-type": "text/html" },
        }),
      );
    },
    async () => {
      const embed = await createExternalEmbed(
        {} as Denops,
        "https://example.com/article",
      );

      assertEquals(embed, {
        $type: "app.bsky.embed.external",
        external: {
          uri: "https://example.com/article",
          title: "A & B",
          description: "Description <text>",
        },
      });
    },
  );
});

Deno.test("createExternalEmbed attaches uploaded thumbnail", async () => {
  const responses = [
    new Response(
      '<meta property="og:title" content="Title"><meta property="og:image" content="/thumb.png">',
    ),
    new Response(new Blob(["png"], { type: "image/png" }), {
      headers: { "content-type": "image/png" },
    }),
    Response.json({
      did: "did:example:alice",
      handle: "alice.test",
      email: "alice@example.com",
      accessJwt: "access",
      refreshJwt: "refresh",
    }),
    Response.json({ blob: { ref: "blob-ref" } }),
  ];

  await withDenoStubs(() =>
    withFetchStub(
      () => Promise.resolve(responses.shift() ?? Response.json({})),
      async () => {
        const embed = await createExternalEmbed(
          createDenops(),
          "https://example.com/article",
        );

        assertEquals(embed?.external.thumb, { ref: "blob-ref" });
      },
    )
  );
});

Deno.test("createExternalEmbed ignores thumbnail when image fetch fails", async () => {
  const responses = [
    new Response(
      '<meta property="og:title" content="Title"><meta property="og:image" content="/thumb.png">',
    ),
    new Response("missing", { status: 404 }),
  ];

  await withFetchStub(
    () => Promise.resolve(responses.shift() ?? Response.json({})),
    async () => {
      const embed = await createExternalEmbed(
        createDenops(),
        "https://example.com/article",
      );

      assertEquals(embed?.external.thumb, undefined);
    },
  );
});

Deno.test("createExternalEmbed ignores oversized thumbnails", async () => {
  const responses = [
    new Response(
      '<meta property="og:title" content="Title"><meta property="og:image" content="/thumb.png">',
    ),
    new Response(new Blob([new Uint8Array(1_000_001)], { type: "image/png" }), {
      headers: { "content-type": "image/png" },
    }),
  ];

  await withFetchStub(
    () => Promise.resolve(responses.shift() ?? Response.json({})),
    async () => {
      const embed = await createExternalEmbed(
        createDenops(),
        "https://example.com/article",
      );

      assertEquals(embed?.external.thumb, undefined);
    },
  );
});

Deno.test("createExternalEmbed ignores non-image thumbnails", async () => {
  const responses = [
    new Response(
      '<meta property="og:title" content="Title"><meta property="og:image" content="/thumb.txt">',
    ),
    new Response("text", {
      headers: { "content-type": "text/plain" },
    }),
  ];

  await withFetchStub(
    () => Promise.resolve(responses.shift() ?? Response.json({})),
    async () => {
      const embed = await createExternalEmbed(
        createDenops(),
        "https://example.com/article",
      );

      assertEquals(embed?.external.thumb, undefined);
    },
  );
});

Deno.test("createExternalEmbed ignores failed blob uploads", async () => {
  const responses = [
    new Response(
      '<meta property="og:title" content="Title"><meta property="og:image" content="/thumb.png">',
    ),
    new Response(new Blob(["png"], { type: "image/png" }), {
      headers: { "content-type": "image/png" },
    }),
    Response.json({
      did: "did:example:alice",
      handle: "alice.test",
      email: "alice@example.com",
      accessJwt: "access",
      refreshJwt: "refresh",
    }),
    Response.json({ error: "UploadFailed" }, { status: 500 }),
  ];
  const originalLog = console.log;
  console.log = () => {};

  try {
    await withDenoStubs(() =>
      withFetchStub(
        () => Promise.resolve(responses.shift() ?? Response.json({})),
        async () => {
          const embed = await createExternalEmbed(
            createDenops(),
            "https://example.com/article",
          );

          assertEquals(embed?.external.thumb, undefined);
        },
      )
    );
  } finally {
    console.log = originalLog;
  }
});

Deno.test("createExternalEmbed falls back to title element", async () => {
  await withFetchStub(
    () =>
      Promise.resolve(
        new Response("<title>  Example   Page  </title>", {
          headers: { "content-type": "text/html" },
        }),
      ),
    async () => {
      const embed = await createExternalEmbed(
        {} as Denops,
        "https://example.com/page",
      );

      assertEquals(embed?.external.title, "Example Page");
      assertEquals(embed?.external.description, "");
    },
  );
});

Deno.test("createExternalEmbed returns undefined when metadata fetch fails", async () => {
  await withFetchStub(
    () => Promise.resolve(new Response("not found", { status: 404 })),
    async () => {
      const originalError = console.error;
      console.error = () => {};
      try {
        const embed = await createExternalEmbed(
          {} as Denops,
          "https://example.com/missing",
        );

        assertEquals(embed, undefined);
      } finally {
        console.error = originalError;
      }
    },
  );
});
