import { Denops, helper } from "./../deps.ts";
import { Session } from "./../types.ts";
import * as server from "./server.ts";
/*
 *
 */
export async function get(ds: Denops, url: string): Promise<Response> {
  let session = await server.getSession(ds);
  let res = await _get(session, url);
  if (res.status != 200) {
    const json = await res.json();
    if (json.error == "ExpiredToken") {
      session = await server.newSession(ds);
      res = await _get(session, url);
    } else {
      helper.execute(
        ds,
        `echoerr "request error : ${res.status} / ${res.statusText}"`
      );
    }
  }

  return res;
}

async function _get(session: Session, url: string): Promise<Response> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessJwt}`,
    },
  });

  return res;
}

export async function post(
  ds: Denops,
  url: string,
  data: string
): Promise<Response> {
  const session = await server.getSession(ds);
  data = data.replace("$SESSION_DID", session.did);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessJwt}`,
    },
    body: data,
  });

  return res;
}
