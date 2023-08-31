// https://atproto.com/lexicons/com-atproto-repo
import { Session } from "./types.ts";

const postUrl = "https://bsky.social/xrpc/com.atproto.repo.createRecord";

// https://atproto.com/lexicons/com-atproto-repo#comatprotorepocreaterecord
export const createRecord = async (session: Session, text: string) => {
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
