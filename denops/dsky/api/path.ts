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

export async function getConfigDir(ds: Denops): Promise<string> {
  const home = Deno.env.get("USERPROFILE") ?? Deno.env.get("HOME");
  if (home) {
    return `${home.replace(/\\/g, "/")}/.config/dsky`;
  }

  return await expand(ds, "~/.config/dsky");
}

export async function getConfigFile(
  ds: Denops,
  name: string,
): Promise<string> {
  return `${await getConfigDir(ds)}/${name}`;
}
