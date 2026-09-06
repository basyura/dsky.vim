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

" Feed input after inputsave() so it models interactive typing.
function! s:search_input(keys) abort
  call timer_start(1, {-> feedkeys(a:keys, 'nt')})
  call dsky#search()
endfunction

call assert_equal('<Plug>(dsky_search)', maparg('q', 'n'))
call assert_equal(1, maparg('q', 'n', 0, 1).buffer)
call assert_equal(1, maparg('<Plug>(dsky_search)', 'n', 0, 1).silent)
call assert_equal(0, exists(':DSkySearch'))
let s:query = '日本語 "hello world" #tag & from:alice.test | %'
let g:denops_request_responses.searchPosts = [extend(copy(s:post), {'text': 'found'})]
call s:search_input(s:query . "\<CR>")
call assert_equal(['dsky', 'searchPosts', [s:query]], g:denops_request_calls[-1])
call assert_match('found', getline(1))
call assert_equal(2, line('$'))
let s:before = getline(1, '$')
let s:count = len(g:denops_request_calls)
call s:search_input("   \<CR>")
call s:search_input("cancel\<Esc>")
call assert_equal(s:count, len(g:denops_request_calls))
call assert_equal(s:before, getline(1, '$'))

let g:denops_request_error = 'search failed'
try
  call s:search_input("test\<CR>")
  call assert_report('Expected search failure')
catch /search failed/
endtry
unlet g:denops_request_error
call assert_equal(s:before, getline(1, '$'))

" Reload retains the successful query after cancelled and failed searches.
let g:denops_request_responses.searchPosts = [extend(copy(s:post), {'text': 'refreshed'})]
call feedkeys("\\\\", 'xt')
call assert_equal(['dsky', 'searchPosts', [s:query]], g:denops_request_calls[-1])
call assert_match('refreshed', getline(1))
call assert_equal(s:query, b:dsky_search_query)

let g:denops_request_responses.searchPosts = []
call s:search_input("missing\<CR>")
call assert_equal([''], getline(1, '$'))
call assert_equal({}, b:dsky_buf)
call assert_equal(0, &modifiable)
call feedkeys("\\\\", 'xt')
call assert_equal(['dsky', 'searchPosts', ['missing']], g:denops_request_calls[-1])

" Switching away from search restores the existing timeline reload behavior.
for s:view in ['timeline', 'notifications', 'author_feed']
  call s:search_input("keyword\<CR>")
  if s:view ==# 'author_feed'
    call dsky#author_feed('alice.test')
  else
    call call('dsky#' . s:view, [])
  endif
  call assert_false(exists('b:dsky_search_query'))
  call feedkeys("\\\\", 'xt')
  call assert_equal(['dsky', 'getTimeline', [g:dsky_timeline_limit]], g:denops_request_calls[-1])
endfor
enew
call assert_equal('', maparg('q', 'n'))

if len(v:errors) > 0
  for s:error in v:errors
    echomsg s:error
  endfor
  cquit
endif

quit!
