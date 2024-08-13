import { Denops, helper } from "./../deps.ts";
import { Session } from "./../types.ts";
import * as server from "./server.ts";
/*
 *
 */
export async function get(ds: Denops, url: string): Promise<Response> {
  try {
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
    res.session = session;
    return res;
  } catch (e) {
    helper.execute(ds, `echoerr "request error : ${e.exception}"`);
    return new Response();
  }
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
  const session = await server.newSession(ds);
  data = data.replace("$SESSION_DID", session.did);

  const param = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessJwt}`,
    },
    body: data,
  };

  const res = await fetch(url, param);

  if (res.status != 200) {
    console.log(res.status, res.statusText, "\n", JSON.stringify(param));
  }

  res.session = session;
  return res;
}
