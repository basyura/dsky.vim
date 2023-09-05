import { Denops, fn } from "./deps.ts";
import * as repo from "./api/repo.ts";
import * as notification from "./api/notification.ts";
import * as path from "./api/path.ts";
import * as buffer from "./ui/buffer.ts";

export async function main(ds: Denops): Promise<void> {
  await initialize(ds);

  ds.dispatcher = {
    // com.atproto.repo.createRecord
    async createRecord(text: unknown): Promise<void> {
      return await repo.createRecord(ds, text);
    },
    // app.bsky.feed.getTimeline
    async getTimeline(): Promise<unknown> {
      return await buffer.loadTimeline(ds);
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
