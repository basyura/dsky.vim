"
function! dsky#timeline(...) abort
  let limit = g:dsky_timeline_limit
  if a:0 != 0
    let limit = a:1
  endif
  let posts = dsky#api#timeline(limit)
  call dsky#buffer#load(posts)
endfunction
"
function! dsky#notifications() abort
  let posts = dsky#api#notifications()
  call dsky#buffer#load(posts)
endfunction
"
function! dsky#author_feed(...) abort
  let handle = ""
  if len(a:000) > 0
    let handle = a:000[0]
  else
    let num = line(".")
    if !has_key(b:dsky_buf, num)
      echo "no post"
      return
    endif
    let handle = b:dsky_buf[num].handle
  endif

  let posts = dsky#api#author_feed(handle)
  call dsky#buffer#load(posts)
endfunction
"
function! dsky#like() abort
  let num = line(".")
  if !has_key(b:dsky_buf, num)
    echo "no post"
    return
  endif
  let uri = b:dsky_buf[num].uri
  let cid = b:dsky_buf[num].cid

  let res = dsky#api#like(uri, cid)
  if res.status != 200
    echo "failed ..."
    return
  endif
   
  echo "liked 🧡"

  let line = getline(num)
  let pair = dsky#util#str#split(line, g:dsky_author_len)
  let name = dsky#util#str#sub(pair[0], g:dsky_author_len - 3) . "🧡 "
  let msg  = name . pair[1]

  setlocal modifiable
  call setline(num, msg)
  setlocal nomodifiable


endfunction
"
function! dsky#open_links() abort
  let line = getline(".")
  let matched = matchlist(line, 'https\?://[0-9A-Za-z_#?~=\-+%\.\/:]\+')
  if len(matched) == 0
    return
  endif
  execute "OpenBrowser " . matched[0]
endfunction
"
function! dsky#new_session() abort
  call dsky#api#new_session()
  echo "created new session"
endfunction


