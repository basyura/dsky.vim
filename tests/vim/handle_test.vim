set nocompatible
set nomore
set runtimepath^=tests/vim/fixtures

source autoload/dsky/handle.vim

let g:denops_request_calls = []
let g:denops_request_responses = {
      \ 'getHandles': ['alice.test', 'bob.test', 'alice.dev'],
      \ }

call assert_equal(
      \ ['alice.test', 'bob.test', 'alice.dev'],
      \ dsky#handle#complete('', 'DSkyAuthorFeed ', 15))
call assert_equal(
      \ ['alice.test', 'alice.dev'],
      \ dsky#handle#complete('alice', 'DSkyAuthorFeed alice', 20))
call assert_equal([
      \ ['dsky', 'getHandles', []],
      \ ['dsky', 'getHandles', []],
      \ ], g:denops_request_calls)

if len(v:errors) > 0
  for s:error in v:errors
    echomsg s:error
  endfor
  cquit
endif

quit
