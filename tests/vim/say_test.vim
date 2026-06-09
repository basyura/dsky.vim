set nocompatible
set nomore
set runtimepath^=tests/vim/fixtures

source autoload/dsky/say.vim

let g:denops_request_calls = []
let g:denops_request_responses = {
      \ 'createRecord': v:false,
      \ }

call dsky#say#open()
call assert_equal('dsky_say', expand('%'))
call assert_equal('dsky_say', &filetype)
call assert_equal('nofile', &buftype)
call assert_equal(0, &buflisted)

setlocal modifiable
call setline(1, ['  hello', 'world  '])
call dsky#say#post_buffer()
call assert_equal([
      \ ['dsky', 'createRecord', ["hello\nworld"]],
      \ ], g:denops_request_calls)
call assert_equal('dsky_say', expand('%'))

let g:denops_request_responses = {
      \ 'createRecord': v:true,
      \ }
call dsky#say#post_buffer()
call assert_notequal('dsky_say', expand('%'))

if len(v:errors) > 0
  for s:error in v:errors
    echomsg s:error
  endfor
  cquit
endif

quit
