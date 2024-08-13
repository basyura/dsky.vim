
function dsky#util#str#sub(str, len) abort
  if (strwidth(a:str) <= a:len)
    return a:str
  endif

  let tmp = ""
  for i in range(0, strcharlen(a:str))
    let c = strcharpart(a:str, i, 1)
    if strwidth(tmp . c) > a:len
      break
    endif
    let tmp .= c
  endfor

  return tmp
endfunction

function dsky#util#str#split(str, len) abort
  if (strwidth(a:str) <= a:len)
    return [a:str, ""]
  endif

  let before = ""
  let after = ""
  for i in range(0, strcharlen(a:str))
    let c = strcharpart(a:str, i, 1)
    if strwidth(before . c) > a:len
      let after = strcharpart(a:str, i)
      break
    endif
    let before .= c
  endfor

  return [before, after]
endfunction
