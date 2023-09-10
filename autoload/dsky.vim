let g:dsky_open_buffer_cmd = 'edit!'
let s:AUTHOR_LEN = 16

let s:last_bufnr = 0
let s:buf_name = "dsky"

function! dsky#timeline()
  let posts = dsky#api#timeline()
  let sep = s:createSeparator()

  call s:switch_buffer()
  call s:pre_proc()

  let row = 1
  let buf = {}
  for post in posts
    let lines = s:format(post)
    let lines = add(lines, sep)
    call setline(row, lines)
    let buf[row] = post
    let row = row + len(lines)
  endfor
  let b:dsky_buf = buf

  call s:post_proc()
endfunction

" function! dsky#timeline()
"   call s:switch_buffer()
"   call denops#request("dsky", "getTimeline", [])
" endfunction

function! dsky#author_feed(actor)
  call s:switch_buffer()
  call denops#request("dsky", "getAuthorFeed", [a:actor])
endfunction


function! dsky#notifications()
  call s:switch_buffer()
  call denops#request("dsky", "listNotifications", [])
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

function! s:pre_proc()
  setlocal modifiable
  silent %delete _
endfunction


function! s:post_proc()
    setfiletype dsky
    execute "setlocal breakindentopt=shift:" . s:AUTHOR_LEN
    setlocal bufhidden=wipe
    setlocal noswapfile
    setlocal nomodifiable
    setlocal nonumber
    setlocal nomodified
    setlocal signcolumn=no

    nmap <silent> <buffer> <Leader><Leader>  <Plug>(dsky_reload)
    nmap <silent> <buffer> o  <Plug>(dsky_open_links)

    call cursor(1, s:AUTHOR_LEN+ 1)
endfunction

function! s:format(post) abort

  let name = a:post.name
  " 長い名前を削る
  if (strwidth(name) > s:AUTHOR_LEN)
    let tmp = ""
    for i in range(0, strcharlen(name))
      let c = strcharpart(name, i, 1)
      if strwidth(tmp . c) > s:AUTHOR_LEN - 1
        break
      endif
      let tmp .= c
    endfor
    let name = tmp
  endif


  let name = s:padding(name, " ", s:AUTHOR_LEN)
  let lines = split(a:post.text, "\n")
  let lines[0] = name . lines[0]
  let lines[len(lines)-1] .= " - " . a:post.createdAt

  " 先頭にインデントを付ける
  let pad = s:padding("", "　", s:AUTHOR_LEN/2)
  if len(lines) > 1
    for i in range(1,len(lines)-1)
      let lines[i] = pad . lines[i]
    endfor
  endif

  return lines
endfunction

function s:createSeparator()
  let width = winwidth(0)
  return s:padding("", "-", width)
endfunction

function s:padding(s, sep, len)
  let pad_len = a:len - strwidth(a:s)
  if pad_len <= 0
    return a:s
  endif

  let result = a:s
  for i in range(pad_len)
    let result .= a:sep
  endfor
  return result
endfunction
