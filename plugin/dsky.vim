if exists('g:loaded_dsky')
  finish
endif
let g:loaded_dsky = 1


command! DSkySay :call dsky#say#open()
command! DSkyTimeline :call dsky#timeline()


nnoremap <silent> <Plug>(dsky_say_post_buffer)  :<C-u>call dsky#say#post_buffer()<CR>
