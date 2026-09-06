let g:dsky_open_buffer_cmd = 'edit!'

let s:last_bufnr = 0
let s:buf_name = "dsky"

function! dsky#buffer#load(posts, ...) abort
  let sep = s:createSeparator()

  call s:switch_buffer()
  call s:pre_proc()

  let row = 1
  let buf = {}
  for post in a:posts
    let lines = s:format(post)
    let lines = add(lines, sep)
    call setline(row, lines)
    let buf[row] = post
    let row = row + len(lines)
  endfor
  let b:dsky_buf = buf

  call s:post_proc()
  unlet! b:dsky_search_query
  if a:0 > 0
    let b:dsky_search_query = a:1
  endif
endfunction


function! s:switch_buffer() abort
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

function! s:pre_proc() abort
  setlocal modifiable
  silent %delete _
endfunction


function! s:post_proc() abort
    setfiletype dsky
    execute "setlocal breakindentopt=shift:" . g:dsky_author_len
    setlocal bufhidden=wipe
    setlocal noswapfile
    setlocal nomodifiable
    setlocal nonumber
    setlocal nomodified
    setlocal signcolumn=no
    setlocal breakindent

    nmap <silent> <buffer> <Leader><Leader>  <Plug>(dsky_reload)
    nmap <silent> <buffer> o      <Plug>(dsky_open_links)
    nmap <silent> <buffer> u      <Plug>(dsky_author_feed)
    nmap <silent> <buffer> q      <Plug>(dsky_search)
    nmap <silent> <buffer> <Leader>f  <Plug>(dsky_like)

    call cursor(1, g:dsky_author_len + 1)
endfunction

function! s:format(post) abort
  try
    " 長い名前は削る
    let name = s:display_name(a:post)
    let name = s:substr(name, g:dsky_author_len -1)
    let name = s:padding(name, " ", g:dsky_author_len)
    let lines = s:split_urls(a:post.text)
    let lines = s:compact_blank_lines(lines)
    if len(lines) == 0
      let lines = ["no text"]
    endif

    if a:post.isLiked
      let lines[0] = s:substr(name, g:dsky_author_len - 3) . "🧡 " . lines[0]
    else
      let lines[0] = name . lines[0]
    endif
    let lines[len(lines)-1] .= " - " . a:post.createdAt

    " 2行目以降の先頭にインデントを付ける
    let pad = s:padding("", "　", g:dsky_author_len/2)
    if len(lines) > 1
      for i in range(1,len(lines)-1)
        let lines[i] = pad . lines[i]
      endfor
    endif

    return lines
  catch
    return ["failed to format: " . json_encode(a:post), v:exception, v:throwpoint ]
  endtry
endfunction

function s:createSeparator() abort
  let width = max([1, winwidth(0) - 2])
  return repeat("-", width)
endfunction

function s:display_name(post) abort
  let name = get(a:post, "name", "")
  if type(name) != v:t_string || empty(name)
    let name = get(a:post, "handle", "")
  endif
  if type(name) != v:t_string || empty(name)
    let name = "*****"
  endif
  return name
endfunction

function s:padding(s, sep, len) abort
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

function s:substr(str, len) abort
  return dsky#util#str#sub(a:str, a:len)
endfunction

function s:split_urls(text) abort
  let result = []
  for line in split(a:text, "\n", 1)
    call extend(result, s:split_urls_in_line(line))
  endfor
  return result
endfunction

function s:split_urls_in_line(line) abort
  let result = []
  let rest = a:line
  while v:true
    let idx = match(rest, '\S[ \t　]*\zshttps\?://')
    if idx < 0
      break
    endif
    call add(result, substitute(strpart(rest, 0, idx), '[ \t　]\+$', '', ''))
    let rest = strpart(rest, idx)
  endwhile
  call add(result, rest)
  return result
endfunction

function s:compact_blank_lines(lines) abort
  let result = []
  let prev_blank = v:false
  for line in a:lines
    let blank = s:is_blank_line(line)
    if !(blank && prev_blank)
      call add(result, line)
    endif
    let prev_blank = blank
  endfor
  return result
endfunction

function s:is_blank_line(line) abort
  return a:line =~# '^[[:space:]　]*$'
endfunction
