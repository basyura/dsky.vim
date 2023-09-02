import { Denops, unknownutil, fn, ptera } from "./deps.ts";
import * as consts from "./consts.ts";

export class Post {
  author: string;
  text: string;
  createdAt: ptera.DateTime;
  feature: string;
  //
  constructor(post: any) {
    this.author = post.author.displayName;
    this.text = post.record.text;
    this.createdAt = ptera.datetime(post.record.createdAt);
    this.createdAt = this.createdAt.add({ hour: this.createdAt.offsetHour() });
    this.feature = "";

    const facets = post.record.facets;
    if (facets != null && facets[0].features != null) {
      this.feature = facets[0].features[0].uri;
    }
  }
  //
  async format(ds: Denops): Promise<Array<string>> {
    const lines = this.text.split("\n");
    lines[lines.length - 1] += ` - ${this.createdAt.format("MM/dd HH:mm")}`;
    let name = this.author;
    if (name == null) {
      name = "*****";
    }

    let len = await fn.strwidth(ds, name);
    unknownutil.ensureNumber(len);
    // todo
    if (len > consts.AUTHOR_LEN) {
      const unknown_name = await fn.strpart(ds, name, 0, consts.AUTHOR_LEN + 2);
      unknownutil.ensureString(unknown_name);
      name = unknown_name;
      len = await fn.strwidth(ds, name);
      unknownutil.ensureNumber(len);
    }
    const pad = "".padEnd(consts.AUTHOR_LEN - len, " ");

    const ret = new Array<string>();
    ret.push(`${name}${pad}${lines[0]}`);
    for (let i = 1; i < lines.length; i++) {
      let line = lines[i];
      // カーソルが左右に移動しないように
      if (line == "") {
        line = " ";
      }
      ret.push("".padStart(consts.AUTHOR_LEN / 2, "　") + line);
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
    if (session.length == 0) {
      this.did = "";
      this.handle = "";
      this.email = "";
      this.accessJwt = "";
      this.refreshJwt = "";
      return;
    }
    this.did = session.did;
    this.handle = session.handle;
    this.email = session.email;
    this.accessJwt = session.accessJwt;
    this.refreshJwt = session.refreshJwt;
  }
}
