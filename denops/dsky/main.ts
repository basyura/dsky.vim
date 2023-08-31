import { Denops, unknownutil } from "./deps.ts";
import { createRecord } from "./repo.ts";
import { createSession } from "./server.ts";
import { getTimeline } from "./feed.ts";

export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    // com.atproto.repo.createRecord
    async createRecord(text: unknown): Promise<unknown> {
      unknownutil.ensureString(text);
      if (text == "") {
        return Promise.resolve("");
      }

      const session = await createSession(denops);
      const json = await createRecord(session, text);
      const result = JSON.stringify(json);

      return Promise.resolve(result);
    },
    // app.bsky.feed.getTimeline
    async getTimeline(): Promise<unknown> {
      const session = await createSession(denops);
      const posts = await getTimeline(session);
      posts.forEach((v, i) => {
        denops.call("setline", i + 1, `${v.author.padEnd(15, " ")}:${v.text}`);
      });
      return Promise.resolve();
    },
  };
}
