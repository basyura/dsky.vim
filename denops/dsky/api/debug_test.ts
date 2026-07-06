import type { Denops } from "./../deps.ts";
import { writeDebugJson } from "./debug.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, but got ${actualJson}`);
  }
}

function withDenoStubs<T>(
  writeTextFile: typeof Deno.writeTextFile,
  fn: () => Promise<T>,
): Promise<T> {
  const originalWriteTextFile = Deno.writeTextFile;

  Object.defineProperty(Deno, "writeTextFile", {
    value: writeTextFile,
  });

  return fn().finally(() => {
    Object.defineProperty(Deno, "writeTextFile", {
      value: originalWriteTextFile,
    });
  });
}

function createDenops(debugEnabled: number): Denops {
  return {
    meta: { mode: "test", host: "nvim" },
    eval: (
      expr: string,
      ctx: { n?: string; v?: unknown },
    ): unknown => {
      if (
        expr === "exists(n) ? g:dsky_debug_enabled : v" &&
        ctx.n === "g:dsky_debug_enabled"
      ) {
        return debugEnabled;
      }
      throw new Error(`Unexpected eval: ${expr}`);
    },
    call: (name: string, arg: unknown): unknown => {
      if (name === "expand" && arg === "~/Desktop/debug.json") {
        return "/tmp/debug.json";
      }
      throw new Error(`Unexpected function: ${name}`);
    },
  } as unknown as Denops;
}

Deno.test("writeDebugJson skips output when debug is disabled", async () => {
  const writes = new Array<unknown>();

  await withDenoStubs(
    (...args) => {
      writes.push(args);
      return Promise.resolve();
    },
    async () => {
      await writeDebugJson(createDenops(0), { ok: true });

      assertEquals(writes, []);
    },
  );
});

Deno.test("writeDebugJson writes debug.json when debug is enabled", async () => {
  const writes = new Array<unknown>();

  await withDenoStubs(
    (...args) => {
      writes.push(args);
      return Promise.resolve();
    },
    async () => {
      await writeDebugJson(createDenops(1), { ok: true });

      assertEquals(writes, [["/tmp/debug.json", '{"ok":true}']]);
    },
  );
});
