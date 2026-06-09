set nocompatible
set nomore
set runtimepath^=tests/vim/fixtures

source plugin/dsky.vim
source autoload/dsky/util/str.vim
source autoload/dsky/api.vim
source autoload/dsky/buffer.vim
source autoload/dsky.vim

let s:post = {
      \ 'name': 'Alice',
      \ 'handle': 'alice.test',
      \ 'text': 'hello',
      \ 'createdAt': '06/07 12:00',
      \ 'isLiked': v:false,
      \ 'uri': 'at://alice/post/1',
      \ 'cid': 'cid1',
      \ }

let g:denops_request_calls = []
let g:denops_request_responses = {
      \ 'getTimeline': [s:post],
      \ 'listNotifications': [s:post],
      \ 'getAuthorFeed': [s:post],
      \ 'like': {'status': 200},
      \ 'newSession': v:true,
      \ }

call dsky#timeline()
call assert_equal(['dsky', 'getTimeline', [g:dsky_timeline_limit]], g:denops_request_calls[-1])
call assert_match('^Alice\s\+hello - 06/07 12:00$', getline(1))

call dsky#timeline(3)
call assert_equal(['dsky', 'getTimeline', [3]], g:denops_request_calls[-1])

call dsky#notifications()
call assert_equal(['dsky', 'listNotifications', []], g:denops_request_calls[-1])

call dsky#author_feed('bob.test')
call assert_equal(['dsky', 'getAuthorFeed', ['bob.test']], g:denops_request_calls[-1])

setlocal modifiable
call setline(1, 'Alice           hello - 06/07 12:00')
let b:dsky_buf = {
      \ 1: {
      \   'handle': 'carol.test',
      \   'uri': 'at://carol/post/1',
      \   'cid': 'cid2',
      \ },
      \ }
call cursor(1, 1)
call dsky#author_feed()
call assert_equal(['dsky', 'getAuthorFeed', ['carol.test']], g:denops_request_calls[-1])

setlocal modifiable
call setline(1, 'Carol           hello - 06/07 12:00')
let b:dsky_buf = {
      \ 1: {
      \   'handle': 'carol.test',
      \   'uri': 'at://carol/post/1',
      \   'cid': 'cid2',
      \ },
      \ }
call cursor(1, 1)
call dsky#like()
call assert_equal(['dsky', 'like', ['at://carol/post/1', 'cid2']], g:denops_request_calls[-1])
call assert_match('^Carol.*hello - 06/07 12:00$', getline(1))

call dsky#new_session()
call assert_equal(['dsky', 'newSession', []], g:denops_request_calls[-1])

if len(v:errors) > 0
  for s:error in v:errors
    echomsg s:error
  endfor
  cquit
endif

quit!
