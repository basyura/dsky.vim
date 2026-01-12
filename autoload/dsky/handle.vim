function! dsky#handle#complete(ArgLead, CmdLine, CursorPos) abort
  let handles = denops#request('dsky', 'getHandles', [])
  if a:ArgLead == ''
    return handles
  endif
  return filter(handles, 'v:val =~ "^" . a:ArgLead')
endfunction
