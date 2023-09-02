

let g:dsky_open_buffer_cmd = 'edit!'
let s:last_bufnr = 0
let s:buf_name = "dsky"

function! dsky#timeline()
  call s:switch_buffer()
  call denops#request("dsky", "getTimeline", [])
endfunction

function! dsky#open_links()
  let line = getline(".")
  let matched = matchlist(line, 'https\?://[0-9A-Za-z_#?~=\-+%\.\/:]\+')
  if len(matched) == 0
    return
  endif
  execute "OpenBrowser " . matched[0]

endfunction

function! s:switch_buffer()
  " get buf no from buffer's name
  let bufnr = -1
  let num   = bufnr('$')
  while num >= s:last_bufnr
    if getbufvar(num, '&filetype') ==# 'dsky'
      let bufnr = num
      break
    endif
    let num -= 1
  endwhile
  " buf is not exist
  if bufnr < 0
    execute 'silent ' . g:dsky_open_buffer_cmd . ' ' . s:buf_name
    let s:last_bufnr = bufnr("")
    return
  endif
  " buf is exist in window
  let winnr = bufwinnr(bufnr)
  if winnr > 0
    execute winnr 'wincmd w'
    return
  endif
  " buf is exist
  if buflisted(bufnr)
    if g:dsky_open_buffer_cmd =~ "split"
      execute 'silent ' . g:dsky_open_buffer_cmd
    endif
    execute 'buffer ' . bufnr
  else
    " buf is already deleted
    execute 'silent ' . g:dsky_open_buffer_cmd . ' ' . s:buf_name
    let s:last_bufnr = bufnr("")
  endif
endfunction
