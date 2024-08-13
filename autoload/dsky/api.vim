function! dsky#api#timeline(limit)
  return denops#request("dsky", "getTimeline", [a:limit])
endfunction

function! dsky#api#notifications()
  return denops#request("dsky", "listNotifications", [])
endfunction

function! dsky#api#author_feed(actor)
  return denops#request("dsky", "getAuthorFeed", [a:actor])
endfunction

function! dsky#api#like(uri, cid)
  return denops#request("dsky", "like", [a:uri, a:cid])
endfunction

function! dsky#api#new_session()
  return denops#request("dsky", "newSession", [])
endfunction
