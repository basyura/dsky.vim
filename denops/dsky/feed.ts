import { Denops, unknownutil, helper, fn } from "./deps.ts";
import { Post } from "./types.ts";
import * as proxy from "./proxy.ts";

const URL_GET_TIME_LINE = "https://bsky.social/xrpc/app.bsky.feed.getTimeline";

export const showTimeline = async (ds: Denops): Promise<void> => {
  const posts = await getTimeline(ds);
  const separator = await createSeparator(ds);

  await preProcess(ds);
  await writeTimeline(ds, posts, separator);
  await postProcess(ds);

  return Promise.resolve();
};

const getTimeline = async (ds: Denops): Promise<Array<Post>> => {
  const start = performance.now();
  const res = await proxy.get(ds, URL_GET_TIME_LINE);

  const json = await res.json();
  dump(ds, json);

  const posts: Array<Post> = [];
  const len = json.feed.length;
  for (let i = 0; i < len; i++) {
    posts.push(new Post(json.feed[i].post));
  }

  // console.log(posts.length);

  const end = performance.now();
  helper.echo(ds, `getTimeline ... ${Math.floor(end - start)}ms`);

  return posts;
};

const preProcess = async (ds: Denops): Promise<void> => {
  await helper.execute(
    ds,
    `
        setlocal modifiable
        silent %delete _
        `
  );
};

const postProcess = async (ds: Denops): Promise<void> => {
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
};

const writeTimeline = async (
  ds: Denops,
  posts: Array<Post>,
  separator: string
): Promise<void> => {
  let row = 1;
  for (const post of posts) {
    const lines = await post.format(ds);
    lines.push(separator);
    await ds.call("setline", row, lines);
    row += lines.length;
  }
};

const getWinWidth = async (ds: Denops): Promise<number> => {
  let winwidth = await fn.winwidth(ds, 0);
  unknownutil.ensureNumber(winwidth);
  // todo: number,signcolumn
  winwidth = winwidth - 2;
  unknownutil.ensureNumber(winwidth);

  return winwidth;
};

const createSeparator = async (ds: Denops): Promise<string> => {
  const winwidth = await getWinWidth(ds);
  const separator = "".padEnd(winwidth, "-");
  return separator;
};

const dump = async (ds: Denops, json: any) => {
  const debug_path = await fn.expand(ds, "~/Desktop/debug.json");
  unknownutil.ensureString(debug_path);
  Deno.writeTextFile(debug_path, JSON.stringify(json));
};
