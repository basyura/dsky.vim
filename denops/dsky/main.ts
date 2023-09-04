import { Denops, fn } from "./deps.ts";
import * as repo from "./repo.ts";
import * as feed from "./feed.ts";
import * as notification from "./notification.ts";
import * as path from "./path.ts";

export async function main(ds: Denops): Promise<void> {
  await initialize(ds);

  ds.dispatcher = {
    // com.atproto.repo.createRecord
    async createRecord(text: unknown): Promise<void> {
      return await repo.createRecord(ds, text);
    },
    // app.bsky.feed.getTimeline
    async getTimeline(): Promise<unknown> {
      return await feed.getTimeline(ds);
    },
    // app.bsky.notification.listNotifications
    async listNotifications(): Promise<unknown> {
      return await notification.listNotifications(ds);
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
