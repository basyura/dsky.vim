import type { Denops } from "./../deps.ts";
import type { Post } from "./../types.ts";
import { extractHandles, loadHandles, saveHandles } from "./handle.ts";

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

Deno.test("extractHandles returns unique handles", () => {
  const posts = [
    { handle: "alice.test" },
    { handle: "bob.test" },
    { handle: "alice.test" },
  ] as unknown as Post[];

  assertEquals(extractHandles(posts), ["alice.test", "bob.test"]);
});

Deno.test("saveHandles initializes cache and appends only new handles", async () => {
  const writes = new Array<string>();

  await withDenoStubs(
    {
      envGet: (key: string) => key === "HOME" ? "/tmp/home" : undefined,
      stat: () => Promise.resolve({} as Deno.FileInfo),
      readTextFile: () => Promise.resolve("alice.test\n\nbob.test\n"),
      writeTextFile: (
        _path: string | URL,
        data: string | ReadableStream<string>,
      ) => {
        writes.push(String(data));
        return Promise.resolve();
      },
    },
    async () => {
      await saveHandles({} as Denops, ["bob.test", "carol.test"]);
      const handles = await loadHandles({} as Denops);

      assertEquals(writes, ["carol.test\n"]);
      assertEquals(handles, ["alice.test", "bob.test", "carol.test"]);
    },
  );
});
