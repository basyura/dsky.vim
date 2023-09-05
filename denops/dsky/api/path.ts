import { Denops, fn, unknownutil } from "./../deps.ts";

export async function isExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function expand(ds: Denops, path: string): Promise<string> {
  const expath = await fn.expand(ds, path);
  unknownutil.ensureString(expath);
  return expath;
}
