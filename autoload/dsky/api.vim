function! dsky#api#timeline()
  return denops#request("dsky", "getTimeline", [])
endfunction

function! dsky#api#notifications()
  return denops#request("dsky", "listNotifications", [])
endfunction

function! dsky#api#author_feed(actor)
  return denops#request("dsky", "getAuthorFeed", [a:actor])
endfunction
