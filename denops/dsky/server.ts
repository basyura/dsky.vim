// https://atproto.com/lexicons/com-atproto-server
import { Denops, vars } from "./deps.ts";
import { Session } from "./types.ts";

const sessionUrl = "https://bsky.social/xrpc/com.atproto.server.createSession";

export const createSession = async (ds: Denops): Promise<Session> => {
  const id = (await vars.globals.get(ds, "dsky_id")) as string;
  const pass = (await vars.globals.get(ds, "dsky_password")) as string;

  const res = await fetch(sessionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: `{"identifier": "${id}", "password":"${pass}"}`,
  });
  const json = await res.json();
  return new Session(json);
};
