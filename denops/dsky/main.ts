import { Denops, unknownutil, fn } from "./deps.ts";
import * as repo from "./repo.ts";
import * as feed from "./feed.ts";

export async function main(ds: Denops): Promise<void> {
  await initialize(ds);

  ds.dispatcher = {
    // com.atproto.repo.createRecord
    async createRecord(text: unknown): Promise<void> {
      return await repo.createRecord(ds, text);
    },
    // app.bsky.feed.getTimeline
    async showTimeline(): Promise<unknown> {
      return await feed.showTimeline(ds);
    },
  };
}

async function initialize(ds: Denops): Promise<void> {
  // make config dir
  const config_dir = await fn.expand(ds, "~/.config/dsky");
  unknownutil.ensureString(config_dir);
  try {
    await Deno.stat(config_dir);
  } catch {
    console.log("mkdir", config_dir);
    await fn.mkdir(ds, config_dir, "p");
  }
}
