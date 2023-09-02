if exists('g:loaded_dsky')
  finish
endif
let g:loaded_dsky = 1


command! DSkySay :call dsky#say#open()
command! DSkyTimeline :call dsky#timeline()


nnoremap <silent> <Plug>(dsky_say_post_buffer)  :<C-u>call dsky#say#post_buffer()<CR>
nnoremap <silent> <Plug>(dsky_reload)           :<C-u>call dsky#timeline()<CR>
nnoremap <silent> <Plug>(dsky_open_links)       :<C-u>call dsky#open_links()<CR>
