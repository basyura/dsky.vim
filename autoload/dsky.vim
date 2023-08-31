function! dsky#timeline()
  call denops#request("dsky", "getTimeline", [])
endfunction
