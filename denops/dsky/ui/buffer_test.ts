import type { Denops } from "./../deps.ts";
import type { Post } from "./../types.ts";
import { loadTimeline } from "./buffer.ts";

type Call = {
  name: string;
  args: unknown[];
};

type Command = {
  cmd: string;
  ctx: unknown;
};

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

function createDenops(winwidth: unknown): {
  ds: Denops;
  calls: Call[];
  commands: Command[];
} {
  const calls = new Array<Call>();
  const commands = new Array<Command>();

  const ds = {
    call: (name: string, ...args: unknown[]): unknown => {
      calls.push({ name, args });

      if (name === "winwidth") {
        return winwidth;
      }

      return undefined;
    },
    cmd: (cmd: string, ctx: unknown): void => {
      commands.push({ cmd, ctx });
    },
  } as unknown as Denops;

  return { ds, calls, commands };
}

function createPost(lines: string[]): Post {
  return {
    format: () => Promise.resolve([...lines]),
  } as unknown as Post;
}

Deno.test("loadTimeline writes formatted posts with separators", async () => {
  const { ds, calls, commands } = createDenops(12);
  const posts = [
    createPost(["alice           hello"]),
    createPost(["bob             first", "                second"]),
  ];

  await loadTimeline(ds, posts);

  assertEquals(commands.length, 2);
  assertEquals(calls, [
    {
      name: "winwidth",
      args: [0],
    },
    {
      name: "setline",
      args: [1, ["alice           hello", "----------"]],
    },
    {
      name: "setline",
      args: [3, ["bob             first", "                second", "----------"]],
    },
  ]);
});

Deno.test("loadTimeline runs buffer setup even without posts", async () => {
  const { ds, calls, commands } = createDenops(20);

  await loadTimeline(ds, []);

  assertEquals(commands.length, 2);
  assertEquals(calls, [
    {
      name: "winwidth",
      args: [0],
    },
  ]);
});

Deno.test("loadTimeline rejects when winwidth is not a number", async () => {
  const { ds } = createDenops("20");

  await assertRejects(() => loadTimeline(ds, [createPost(["alice"])]));
});
