import { Denops, unknownutil, helper, fn } from "./../deps.ts";
import { Post } from "./../types.ts";
import * as consts from "./../consts.ts";
import * as feed from "./../api/feed.ts";

export async function loadTimeline(ds: Denops): Promise<void> {
  const posts = await feed.getTimeline(ds);
  const separator = await createSeparator(ds);

  await preProcess(ds);
  await writeTimeline(ds, posts, separator);
  await postProcess(ds);
}

async function preProcess(ds: Denops): Promise<void> {
  await helper.execute(
    ds,
    `
    setlocal modifiable
    silent %delete _
    `
  );
}

async function postProcess(ds: Denops): Promise<void> {
  await helper.execute(
    ds,
    `
    setfiletype dsky
    setlocal breakindentopt=shift:${consts.AUTHOR_LEN}
    setlocal bufhidden=wipe
    setlocal noswapfile
    setlocal nomodifiable
    setlocal nonumber
    setlocal nomodified
    setlocal signcolumn=no

    nmap <silent> <buffer> <Leader><Leader>  <Plug>(dsky_reload)
    nmap <silent> <buffer> o  <Plug>(dsky_open_links)

    call cursor(1, ${consts.AUTHOR_LEN + 1})
    `
  );
}

async function writeTimeline(
  ds: Denops,
  posts: Array<Post>,
  separator: string
): Promise<void> {
  let row = 1;
  for (const post of posts) {
    const lines = await post.format(ds);
    lines.push(separator);
    await ds.call("setline", row, lines);
    row += lines.length;
  }
}

async function getWinWidth(ds: Denops): Promise<number> {
  let winwidth = await fn.winwidth(ds, 0);
  unknownutil.ensureNumber(winwidth);
  // todo: number,signcolumn
  winwidth = winwidth - 2;
  unknownutil.ensureNumber(winwidth);

  return winwidth;
}

async function createSeparator(ds: Denops): Promise<string> {
  const winwidth = await getWinWidth(ds);
  const separator = "".padEnd(winwidth, "-");
  return separator;
}
