import { Denops, fn, unknownutil, vars } from "./../deps.ts";

export async function writeDebugJson(ds: Denops, json: unknown): Promise<void> {
  const enabled = await vars.g.get(ds, "dsky_debug_enabled", 0);
  if (enabled !== 1) {
    return;
  }

  const debugPath = await fn.expand(ds, "~/Desktop/debug.json");
  unknownutil.ensureString(debugPath);
  await Deno.writeTextFile(debugPath, JSON.stringify(json));
}
