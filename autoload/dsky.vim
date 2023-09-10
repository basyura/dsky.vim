"
function! dsky#timeline()
  let posts = dsky#api#timeline()
  call dsky#buffer#load(posts)
endfunction
"
function! dsky#notifications()
  let posts = dsky#api#notifications()
  call dsky#buffer#load(posts)
endfunction
"
function! dsky#author_feed(actor)
  let posts = dsky#api#author_feed(a:actor)
  call dsky#buffer#load(posts)
endfunction
"
function! dsky#open_links()
  let line = getline(".")
  let matched = matchlist(line, 'https\?://[0-9A-Za-z_#?~=\-+%\.\/:]\+')
  if len(matched) == 0
    return
  endif
  execute "OpenBrowser " . matched[0]
endfunction


