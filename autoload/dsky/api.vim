function! dsky#api#timeline()
  return denops#request("dsky", "getTimeline2", [])
endfunction
