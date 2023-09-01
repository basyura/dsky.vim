import { Denops, unknownutil, fn } from "./deps.ts";

export class Post {
  author: string;
  text: string;
  //
  constructor(post: any) {
    this.author = post.author.displayName;
    this.text = post.record.text;
  }
  //
  async format(ds: Denops): Promise<Array<string>> {
    const author_len = 16;
    const lines = this.text.split("\n");
    let name = this.author;
    let len = await fn.strwidth(ds, name);
    unknownutil.ensureNumber(len);
    // todo
    if (len > author_len) {
      const unknown_name = await fn.strpart(ds, name, 0, author_len + 2);
      unknownutil.ensureString(unknown_name);
      name = unknown_name;
      len = await fn.strwidth(ds, name);
      unknownutil.ensureNumber(len);
    }
    const pad = "".padEnd(author_len - len, " ");

    const ret = new Array<string>();
    ret.push(`${name}${pad}${lines[0]}`);
    for (let i = 1; i < lines.length; i++) {
      ret.push("".padStart(author_len / 2, "　") + lines[i]);
    }

    return ret;
  }
}

export class Session {
  did: string;
  handle: string;
  email: string;
  accessJwt: string;
  refreshJwt: string;
  constructor(session: any) {
    this.did = session.did;
    this.handle = session.handle;
    this.email = session.email;
    this.accessJwt = session.accessJwt;
    this.refreshJwt = session.refreshJwt;
  }
}
