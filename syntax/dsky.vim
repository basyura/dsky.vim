if exists('b:current_syntax')
  finish
endif

syntax match dsky_whitespace /　/ containedin=ALL
syntax match dsky_separator /^\-\{10,\}$/


highlight dsky_whitespace guifg=bg
highlight dsky_separator guifg=darkgray
