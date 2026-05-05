import { Denops, helper } from "./../deps.ts";
import { Session } from "./../types.ts";
import * as server from "./server.ts";
import * as consts from "./../consts.ts";

export type ResponseWithSession = Response & { session: Session };
/* */
export async function get(
  ds: Denops,
  url: string,
): Promise<ResponseWithSession> {
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
          `echoerr "request error : ${res.status} / ${res.statusText}"`,
        );
      }
    }
    const resWithSession = res as ResponseWithSession;
    resWithSession.session = session;
    return resWithSession;
  } catch (e) {
    helper.execute(ds, `echoerr "request error : ${String(e)}"`);
    const res = new Response() as ResponseWithSession;
    res.session = new Session([]);
    return res;
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
  data: string,
): Promise<ResponseWithSession> {
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

  const res = await fetch(url, param) as ResponseWithSession;

  if (res.status != 200) {
    console.log(res.status, res.statusText, "\n", JSON.stringify(param));
  }

  res.session = session;
  return res;
}

export async function uploadBlob(
  ds: Denops,
  data: Blob,
  contentType: string,
): Promise<ResponseWithSession> {
  const session = await server.newSession(ds);
  const res = await fetch(consts.URL_UPLOAD_BLOB, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      Authorization: `Bearer ${session.accessJwt}`,
    },
    body: data,
  }) as ResponseWithSession;

  if (res.status != 200) {
    console.log(res.status, res.statusText);
  }

  res.session = session;
  return res;
}
