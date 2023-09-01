import { Denops, unknownutil, helper, fn, vars } from "./deps.ts";
import { createRecord } from "./repo.ts";
import { createSession } from "./server.ts";
import { getTimeline } from "./feed.ts";

export async function main(ds: Denops): Promise<void> {
  ds.dispatcher = {
    // com.atproto.repo.createRecord
    async createRecord(text: unknown): Promise<void> {
      unknownutil.ensureString(text);
      if (text == "") {
        return;
      }

      const session = await createSession(ds);
      const json = await createRecord(session, text);

      if (json.error != null) {
        helper.echo(ds, json);
        helper.echo(ds, json.error + " : " + json.message);
      } else {
        helper.echo(ds, "post ... ok");
      }

      return Promise.resolve();
    },
    // app.bsky.feed.getTimeline
    async getTimeline(): Promise<unknown> {
      const session = await createSession(ds);

      const start = performance.now();
      const posts = await getTimeline(session);
      const end = performance.now();
      helper.echo(ds, `getTimeline ... ${Math.floor(end - start)}ms`);

      let winwidth = await fn.winwidth(ds, 0);
      unknownutil.ensureNumber(winwidth);
      // todo: number,signcolumn
      winwidth = winwidth - 2;
      unknownutil.ensureNumber(winwidth);
      const separator = "".padEnd(winwidth, "-");

      await helper.execute(
        ds,
        `
        setlocal modifiable
        silent %delete _
        `
      );

      let row = 1;
      for (const post of posts) {
        const lines = await post.format(ds);
        lines.push(separator);
        await ds.call("setline", row, lines);
        row += lines.length;
      }

      await helper.execute(
        ds,
        `
        setfiletype dsky
        setlocal breakindentopt=shift:16
        setlocal bufhidden=wipe
        setlocal nobuflisted
        setlocal noswapfile
        setlocal nomodifiable
        setlocal nonumber
        setlocal nomodified
        `
      );

      return Promise.resolve();
    },
  };
}
