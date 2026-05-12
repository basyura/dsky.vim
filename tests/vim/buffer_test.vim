set nocompatible
set nomore

source plugin/dsky.vim
source autoload/dsky/util/str.vim
source autoload/dsky/buffer.vim

let s:created_at = '05/05 14:30'

function! s:post(name, handle) abort
  return {
        \ 'name': a:name,
        \ 'handle': a:handle,
        \ 'text': 'hello',
        \ 'createdAt': s:created_at,
        \ 'isLiked': v:false,
        \ }
endfunction

call dsky#buffer#load([s:post('', 'alice.test')])
call assert_equal('alice.test      hello - ' . s:created_at, getline(1))

call dsky#buffer#load([s:post('', '')])
call assert_equal('*****           hello - ' . s:created_at, getline(1))

call dsky#buffer#load([s:post([], '')])
call assert_equal('*****           hello - ' . s:created_at, getline(1))

if len(v:errors) > 0
  for s:error in v:errors
    echomsg s:error
  endfor
  cquit
endif

quit
