function! denops#request(plugin, method, args) abort
  if !exists('g:denops_request_calls')
    let g:denops_request_calls = []
  endif
  call add(g:denops_request_calls, [a:plugin, a:method, a:args])

  if exists('g:denops_request_responses')
        \ && has_key(g:denops_request_responses, a:method)
    return g:denops_request_responses[a:method]
  endif

  return v:null
endfunction
