import { Denops, unknownutil, helper, fn } from "./../deps.ts";
import { Post } from "./../types.ts";
import * as proxy from "./proxy.ts";
import * as consts from "./../consts.ts";

export async function getTimeline(ds: Denops): Promise<Array<Post>> {
  const start = performance.now();
  const res = await proxy.get(ds, consts.URL_GET_TIME_LINE + "?limit=100");

  const json = await res.json();
  dump(ds, json);

  const posts: Array<Post> = [];
  const len = json.feed.length;
  for (let i = 0; i < len; i++) {
    if (canView(json.feed[i])) {
      posts.push(new Post(json.feed[i].post));
    }
  }

  const end = performance.now();
  helper.echo(ds, `getTimeline ... ${Math.floor(end - start)}ms`);

  return posts;
}

export async function getAuthorFeed(
  ds: Denops,
  actor: string
): Promise<Array<Post>> {
  const res = await proxy.get(
    ds,
    consts.URL_GET_AUTHOR_FEED + `?actor=${actor}`
  );
  const json = await res.json();
  dump(ds, json);

  const posts: Array<Post> = [];
  const len = json.feed.length;
  for (let i = 0; i < len; i++) {
    posts.push(new Post(json.feed[i].post));
  }

  return posts;
}

async function dump(ds: Denops, json: any) {
  const debug_path = await fn.expand(ds, "~/Desktop/debug.json");
  unknownutil.ensureString(debug_path);
  Deno.writeTextFile(debug_path, JSON.stringify(json));
}

function canView(feed: any): boolean {
  if (feed.reply == null) {
    return true;
  }

  return feed.reply.root.author.did == feed.post.author.did;
}
