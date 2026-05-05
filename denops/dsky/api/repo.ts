// https://atproto.com/lexicons/com-atproto-repo
import { Denops, fn, helper, unknownutil } from "./../deps.ts";
import * as proxy from "./proxy.ts";
import * as consts from "./../consts.ts";
import * as facets from "./facets.ts";
import * as embed from "./embed.ts";

// https://atproto.com/lexicons/com-atproto-repo#comatprotorepocreaterecord
export const createRecord = async (
  ds: Denops,
  text: unknown,
): Promise<boolean> => {
  unknownutil.ensureString(text);
  if (text == "") {
    return true;
  }

  const json = await post(ds, text);
  if (json == null) {
    return false;
  }

  if (json.error != null) {
    helper.echo(ds, json);
    helper.echo(ds, json.error + " : " + json.message);
    return false;
  } else {
    helper.echo(ds, "post ... ok");
    return true;
  }
};

const post = async (ds: Denops, text: string) => {
  const facetList = facets.createFacets(text);
  const url = embed.detectFirstUrl(text);

  const record: Record<string, unknown> = {
    text,
    createdAt: new Date().toISOString(),
    langs: ["ja"],
  };

  if (facetList.length > 0) {
    record.facets = facetList;
  }

  if (url != null) {
    const externalEmbed = await embed.createExternalEmbed(ds, url);
    if (externalEmbed == null) {
      const choice = await fn.confirm(
        ds,
        "サイト埋め込みを作成できませんでした。本文だけ投稿しますか？",
        "&本文だけ投稿する\n&中止",
        2,
      );
      if (choice !== 1) {
        helper.echo(ds, "post ... canceled");
        return undefined;
      }
    } else {
      record.embed = externalEmbed;
    }
  }

  const body = JSON.stringify({
    repo: "$SESSION_DID",
    collection: "app.bsky.feed.post",
    record,
  });
  const res = await proxy.post(ds, consts.URL_CREATE_RECORD, body);
  const json = await res.json();
  return json;
};
