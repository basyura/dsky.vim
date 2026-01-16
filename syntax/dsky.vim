if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'dsky'

syntax match dsky_whitespace /　/ containedin=ALL
syntax match dsky_separator /^\-\{10,\}$/
syntax match dsky_link "\<https\?://[[:alnum:]_#!?~=\-+%\.\/:@]\+" contains=NONE display
syntax match dsky_hashtag "[ 　。、，．]\zs[#＃]\S\+" display
syntax match dsky_hashtag "　#\S\+" display contains=dsky_whitespace


highlight default dsky_whitespace guifg=bg
highlight default dsky_separator  guifg=darkgray
highlight default dsky_link       guifg=#80a0ff
highlight default dsky_hashtag    guifg=#ffaa00
