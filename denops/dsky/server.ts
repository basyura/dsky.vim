// https://atproto.com/lexicons/com-atproto-server
import { Denops, vars } from "./deps.ts";
import { Session } from "./types.ts";
import * as path from "./path.ts";

const sessionUrl = "https://bsky.social/xrpc/com.atproto.server.createSession";
const configPath = "~/.config/dsky/session.json";

export async function getSession(ds: Denops): Promise<Session> {
  const confPath = await path.expand(ds, configPath);
  if (!(await path.isExists(confPath))) {
    return await newSession(ds);
  }

  const data = await Deno.readTextFile(confPath);
  return new Session(JSON.parse(data));
}

export async function newSession(ds: Denops): Promise<Session> {
  const id = (await vars.globals.get(ds, "dsky_id")) as string;
  const pass = (await vars.globals.get(ds, "dsky_password")) as string;

  const res = await fetch(sessionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: `{"identifier": "${id}", "password":"${pass}"}`,
  });
  const json = await res.json();

  const confPath = await path.expand(ds, configPath);
  Deno.writeTextFile(confPath, JSON.stringify(json, null, 2));

  return new Session(json);
}
