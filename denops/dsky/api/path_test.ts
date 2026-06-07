import type { Denops } from "./../deps.ts";
import { expand, getConfigDir, getConfigFile, isExists } from "./path.ts";

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
    envGet?: typeof Deno.env.get;
  },
  fn: () => Promise<T>,
): Promise<T> {
  const originalStat = Deno.stat;
  const originalEnvGet = Deno.env.get;

  if (stubs.stat != null) {
    Object.defineProperty(Deno, "stat", { value: stubs.stat });
  }
  if (stubs.envGet != null) {
    Object.defineProperty(Deno.env, "get", { value: stubs.envGet });
  }

  return fn().finally(() => {
    Object.defineProperty(Deno, "stat", { value: originalStat });
    Object.defineProperty(Deno.env, "get", { value: originalEnvGet });
  });
}

Deno.test("isExists returns true when stat succeeds", async () => {
  await withDenoStubs(
    { stat: () => Promise.resolve({} as Deno.FileInfo) },
    async () => {
      assertEquals(await isExists("/tmp/file"), true);
    },
  );
});

Deno.test("isExists returns false when stat fails", async () => {
  await withDenoStubs(
    { stat: () => Promise.reject(new Error("missing")) },
    async () => {
      assertEquals(await isExists("/tmp/file"), false);
    },
  );
});

Deno.test("getConfigDir uses HOME and normalizes backslashes", async () => {
  await withDenoStubs(
    {
      envGet: (key: string) =>
        key === "USERPROFILE" ? "C:\\Users\\alice" : undefined,
    },
    async () => {
      assertEquals(
        await getConfigDir({} as Denops),
        "C:/Users/alice/.config/dsky",
      );
      assertEquals(
        await getConfigFile({} as Denops, "session.json"),
        "C:/Users/alice/.config/dsky/session.json",
      );
    },
  );
});

Deno.test("getConfigDir falls back to Vim expand", async () => {
  const ds = {
    call: (name: string, arg: unknown): unknown => {
      assertEquals(name, "expand");
      assertEquals(arg, "~/.config/dsky");
      return "/expanded/dsky";
    },
  } as unknown as Denops;

  await withDenoStubs(
    { envGet: () => undefined },
    async () => {
      assertEquals(await expand(ds, "~/.config/dsky"), "/expanded/dsky");
      assertEquals(await getConfigDir(ds), "/expanded/dsky");
    },
  );
});
