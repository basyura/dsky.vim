set nocompatible
set nomore
set runtimepath^=tests/vim/fixtures

source autoload/dsky/api.vim

let g:denops_request_calls = []
let g:denops_request_responses = {
      \ 'getTimeline': ['timeline'],
      \ 'listNotifications': ['notification'],
      \ 'getAuthorFeed': ['feed'],
      \ 'like': {'status': 200},
      \ 'newSession': v:true,
      \ }

call assert_equal(['timeline'], dsky#api#timeline(20))
call assert_equal(['notification'], dsky#api#notifications())
call assert_equal(['feed'], dsky#api#author_feed('alice.test'))
call assert_equal({'status': 200}, dsky#api#like('at://uri', 'cid'))
call assert_equal(v:true, dsky#api#new_session())

call assert_equal([
      \ ['dsky', 'getTimeline', [20]],
      \ ['dsky', 'listNotifications', []],
      \ ['dsky', 'getAuthorFeed', ['alice.test']],
      \ ['dsky', 'like', ['at://uri', 'cid']],
      \ ['dsky', 'newSession', []],
      \ ], g:denops_request_calls)

if len(v:errors) > 0
  for s:error in v:errors
    echomsg s:error
  endfor
  cquit
endif

quit
