// https://atproto.com/lexicons/com-atproto-repo
import { Denops, unknownutil, helper } from "./../deps.ts";
import * as proxy from "./proxy.ts";

const URL_CREATE_RECORD =
  "https://bsky.social/xrpc/com.atproto.repo.createRecord";

// https://atproto.com/lexicons/com-atproto-repo#comatprotorepocreaterecord
export const createRecord = async (
  ds: Denops,
  text: unknown
): Promise<void> => {
  unknownutil.ensureString(text);
  if (text == "") {
    return;
  }

  const json = await post(ds, text);

  if (json.error != null) {
    helper.echo(ds, json);
    helper.echo(ds, json.error + " : " + json.message);
  } else {
    helper.echo(ds, "post ... ok");
  }
};

const post = async (ds: Denops, text: string) => {
  const body = `{
      "repo": "$SESSION_DID",
      "collection": "app.bsky.feed.post",
      "record": {
        "text": "${text}", 
        "createdAt" : "${new Date().toISOString()}",
        "langs" : ["ja"]
      }
    }`;
  const res = await proxy.post(ds, URL_CREATE_RECORD, body);
  const json = await res.json();
  return json;
};
