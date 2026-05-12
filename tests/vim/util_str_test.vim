set nocompatible
set nomore

source autoload/dsky/util/str.vim

call assert_equal('abc', dsky#util#str#sub('abc', 5))
call assert_equal('abc', dsky#util#str#sub('abcdef', 3))
call assert_equal('あい', dsky#util#str#sub('あいう', 4))
call assert_equal('あ', dsky#util#str#sub('あいう', 3))
call assert_equal('', dsky#util#str#sub('abc', 0))

call assert_equal(['abc', ''], dsky#util#str#split('abc', 5))
call assert_equal(['abc', 'def'], dsky#util#str#split('abcdef', 3))
call assert_equal(['あい', 'う'], dsky#util#str#split('あいう', 4))
call assert_equal(['あ', 'いう'], dsky#util#str#split('あいう', 3))
call assert_equal(['', 'abc'], dsky#util#str#split('abc', 0))

if len(v:errors) > 0
  for s:error in v:errors
    echomsg s:error
  endfor
  cquit
endif

quit
