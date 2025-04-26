function! dsky#say#open()
  
  let bufnr = bufwinnr('dsky_say')
  if bufnr > 0
    exec bufnr.'wincmd w'
  else
    execute 'belowright split dsky_say'
    execute '2 wincmd _'
    call s:define_default_key_mappings()
    call s:dsky_say_settings()
  endif

  setlocal modifiable
  silent %delete _

  " restore buf
  let preBuf = get(s:, 'dsky_say_pre_buf', [])
  if len(preBuf) != 0 && preBuf[0] != ''
    call setline(1, preBuf)
  else
    startinsert!
  endif

  let &filetype = 'dsky_say'
  setlocal nomodified
endfunction

function! s:define_default_key_mappings()
  augroup dsky_say
    nnoremap <buffer> <silent> q :call <SID>close_buffer()<CR>
    nnoremap <buffer> <silent> <Esc> :call <SID>close_buffer()<CR>
    nmap <buffer> <silent> <CR>   <Plug>(dsky_say_post_buffer)
    imap <buffer> <silent> <C-CR> <ESC><Plug>(dsky_say_post_buffer)
  augroup END
endfunction

function! s:dsky_say_settings()
  setlocal bufhidden=wipe
  setlocal nobuflisted
  setlocal noswapfile
  setlocal modifiable
  setlocal nomodified
  setlocal nonumber
endfunction

function! dsky#say#post_buffer()
  let text = s:get_text()
  if s:post(text)
    let s:dsky_say_pre_buf = []
    bd!
  endif
endfunction

function! s:close_buffer()
  let s:dsky_say_pre_buf = getline(1, '$')
  bd!
endfunction

function! s:get_text()
  let text = matchstr(join(getline(1, '$'), "\n"), '^\_s*\zs\_.\{-}\ze\_s*$')
  return text
endfunction

function! s:post(text)
  call denops#request("dsky", "createRecord", [a:text])
  return 1
endfunction
