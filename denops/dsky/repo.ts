// https://atproto.com/lexicons/com-atproto-repo
import { Denops, unknownutil, helper } from "./deps.ts";
import { createSession } from "./server.ts";
import { Session } from "./types.ts";

const postUrl = "https://bsky.social/xrpc/com.atproto.repo.createRecord";

// https://atproto.com/lexicons/com-atproto-repo#comatprotorepocreaterecord
export const createRecord = async (
  ds: Denops,
  text: unknown
): Promise<void> => {
  unknownutil.ensureString(text);
  if (text == "") {
    return;
  }

  const session = await createSession(ds);
  const json = await post(session, text);

  if (json.error != null) {
    helper.echo(ds, json);
    helper.echo(ds, json.error + " : " + json.message);
  } else {
    helper.echo(ds, "post ... ok");
  }
};

const post = async (session: Session, text: string) => {
  const url = postUrl;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessJwt}`,
    },
    body: `{
      "repo": "${session.did}",
      "collection": "app.bsky.feed.post",
      "record": {
        "text": "${text}", 
        "createdAt" : "${new Date().toISOString()}",
        "langs" : ["ja"]
      }
    }`,
  });

  const json = await res.json();
  return json;
};
