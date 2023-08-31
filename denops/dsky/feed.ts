import { Session, Post } from "./types.ts";

const getTimelineUrl = "https://bsky.social/xrpc/app.bsky.feed.getTimeline";

export const getTimeline = async (session: Session): Promise<Array<Post>> => {
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

  const posts: Array<Post> = [];
  const len = json.feed.length;
  for (let i = 0; i < len; i++) {
    posts.push(new Post(json.feed[i].post));
  }

  // console.log(posts.length);

  return posts;
};
