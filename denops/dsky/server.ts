// https://atproto.com/lexicons/com-atproto-server
import { Denops, unknownutil, vars, fn } from "./deps.ts";
import { Session } from "./types.ts";
import * as path from "./path.ts";

const sessionUrl = "https://bsky.social/xrpc/com.atproto.server.createSession";

export const createSession = async (ds: Denops): Promise<Session> => {
  const config_path = await fn.expand(ds, "~/.config/dsky/session.json");
  unknownutil.ensureString(config_path);

  if (!(await path.isExists(config_path))) {
    console.log("new session");
    return await newSession(ds, config_path);
  }

  console.log("continue session");
  const data = await Deno.readTextFile(config_path);
  return new Session(JSON.parse(data));
};

const newSession = async (
  ds: Denops,
  config_path: string
): Promise<Session> => {
  const id = (await vars.globals.get(ds, "dsky_id")) as string;
  const pass = (await vars.globals.get(ds, "dsky_password")) as string;

  const res = await fetch(sessionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: `{"identifier": "${id}", "password":"${pass}"}`,
  });
  const json = await res.json();
  Deno.writeTextFile(config_path, JSON.stringify(json, null, 2));

  return new Session(json);
};
