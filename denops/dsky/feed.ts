import { Denops, unknownutil, helper, fn } from "./deps.ts";
import { createSession } from "./server.ts";
import { Post } from "./types.ts";

const getTimelineUrl = "https://bsky.social/xrpc/app.bsky.feed.getTimeline";

export const showTimeline = async (ds: Denops): Promise<void> => {
  const posts = await getTimeline(ds);
  const separator = await createSeparator(ds);

  await preProcess(ds);
  await writeTimeline(ds, posts, separator);
  await postProcess(ds);

  return Promise.resolve();
};

const getTimeline = async (ds: Denops): Promise<Array<Post>> => {
  const session = await createSession(ds);

  const start = performance.now();
  // const url = getTimelineUrl + `?actor=${session.handle}`;
  const url = getTimelineUrl;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessJwt}`,
    },
  });

  const json = await res.json();
  // const author = json.feed[0].post.author.displayName;
  // const text = json.feed[0].post.record.text;
  // console.log(res);
  // const json = await res.json();
  //
  Deno.writeTextFile(
    "C:/Users/tatsuya/Desktop/debug.json",
    JSON.stringify(json)
  );

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
