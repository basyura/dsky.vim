import { Denops, fn, unknownutil } from "./deps.ts";
import * as repo from "./api/repo.ts";
import * as notification from "./api/notification.ts";
import * as path from "./api/path.ts";
import * as buffer from "./ui/buffer.ts";
import * as feed from "./api/feed.ts";

export async function main(ds: Denops): Promise<void> {
  await initialize(ds);

  ds.dispatcher = {
    // com.atproto.repo.createRecord
    async createRecord(text: unknown): Promise<void> {
      return await repo.createRecord(ds, text);
    },
    async getTimeline2(): Promise<unknown> {
      return await feed.getTimeline(ds);
    },
    // app.bsky.feed.getTimeline
    async getTimeline(): Promise<unknown> {
      const posts = await feed.getTimeline(ds);
      return await buffer.loadTimeline(ds, posts);
    },
    // app.bsky.feed.getAuthorFeed
    async getAuthorFeed(actor: unknown): Promise<unknown> {
      unknownutil.ensureString(actor);
      const posts = await feed.getAuthorFeed(ds, actor);
      return await buffer.loadTimeline(ds, posts);
    },
    // app.bsky.notification.listNotifications
    async listNotifications(): Promise<unknown> {
      const posts = await notification.listNotifications(ds);
      return await buffer.loadTimeline(ds, posts);
    },
  };
}

async function initialize(ds: Denops): Promise<void> {
  // make config dir
  const dir = await path.expand(ds, "~/.config/dsky");
  try {
    await Deno.stat(dir);
  } catch {
    console.log("mkdir", dir);
    await fn.mkdir(ds, dir, "p");
  }
}
