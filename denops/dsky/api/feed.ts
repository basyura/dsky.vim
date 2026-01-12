import { Denops, unknownutil, helper, fn } from "./../deps.ts";
import { Post } from "./../types.ts";
import * as proxy from "./proxy.ts";
import * as consts from "./../consts.ts";
import * as server from "./server.ts";
import * as handle from "./handle.ts";

export async function getTimeline(
  ds: Denops,
  limit: number
): Promise<Array<Post>> {
  const start = performance.now();
  const url = consts.URL_GET_TIME_LINE + `?limit=${limit}`;
  const res = await proxy.get(ds, url);
  const session = res.session;
  const json = await res.json();
  // dump(ds, json);

  const posts: Array<Post> = [];
  const len = json.feed.length;
  for (let i = 0; i < len; i++) {
    try {
      if (canView(json.feed[i])) {
        posts.push(new Post(session, json.feed[i].post));
      }
    } catch (e) {
      console.error(e)
      console.error(json.feed[i].post);
    }
  }

  const end = performance.now();
  helper.echo(ds, `getTimeline ... ${Math.floor(end - start)}ms`);

  // handle自動保存
  const handles = handle.extractHandles(posts);
  await handle.saveHandles(ds, handles);

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
  // dump(ds, json);

  const posts: Array<Post> = [];
  const len = json.feed.length;
  for (let i = 0; i < len; i++) {
    posts.push(new Post(res.session, json.feed[i].post));
  }

  return posts;
}

export async function like(
  ds: Denops,
  uri: string,
  cid: string
): Promise<void> {
  const body = {
    repo: "$SESSION_DID",
    collection: "app.bsky.feed.like",
    record: {
      subject: {
        uri: uri,
        cid: cid,
      },
      createdAt: new Date().toISOString(),
    },
  };

  const res = await proxy.post(ds, consts.URL_LIKE, JSON.stringify(body));

  const json = await res.json();
  json.status = res.status;

  return json;
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

  return feed.reply.root.author?.did == feed.post.author.did;
}
