import { Denops, unknownutil, fn } from "./../deps.ts";
import * as proxy from "./proxy.ts";
import * as consts from "./../consts.ts";
import { Post } from "../types.ts";
import * as server from "./server.ts";
import * as handle from "./handle.ts";

export async function listNotifications(ds: Denops): Promise<Array<Post>> {
  const res = await proxy.get(ds, consts.URL_LIST_NOTIFICATIONS);

  const json = await res.json();
  const posts: Array<Post> = [];
  const len = json.notifications.length;
  for (let i = 0; i < len; i++) {
    const item = json.notifications[i];
    if (item.reason != "reply") {
      continue;
    }
    posts.push(new Post(res.session, item));
  }

  dump(ds, json);

  // handle自動保存
  const handles = handle.extractHandles(posts);
  await handle.saveHandles(ds, handles);

  return posts;
}

async function dump(ds: Denops, json: any) {
  const debug_path = await fn.expand(ds, "~/Desktop/debug.json");
  unknownutil.ensureString(debug_path);
  Deno.writeTextFile(debug_path, JSON.stringify(json));
}
