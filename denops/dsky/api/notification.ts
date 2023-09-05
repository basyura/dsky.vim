import { Denops, unknownutil, fn } from "./../deps.ts";
import * as proxy from "./proxy.ts";
import * as consts from "./../consts.ts";

export async function listNotifications(ds: Denops): Promise<void> {
  const res = await proxy.get(ds, consts.URL_LIST_NOTIFICATIONS);
  // console.log(res);

  const json = await res.json();

  dump(ds, json);
}

async function dump(ds: Denops, json: any) {
  const debug_path = await fn.expand(ds, "~/Desktop/debug.json");
  unknownutil.ensureString(debug_path);
  Deno.writeTextFile(debug_path, JSON.stringify(json));
}
