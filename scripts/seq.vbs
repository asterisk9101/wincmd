' 名前
'     seq - 単調増加 (減少) する数値列を表示する
' 
' 書式
'     seq [/w] [/s SEP] [/equal-width] [/separator SEP] <LAST | FIRST LAST | FIRST INCR LAST>
' 
'     seq [/?] [/help] [/v] [/version]
' 
' 説明
'     seq は FIRST から LAST まで、INCR ずつ加えた数値を表示する。 
'     LAST または INCR が省略された場合、デフォルトは 1 になる。
' 
' オプション
'     /s SEP, /separator SEP
'         数値を SEP で区切る。(デフォルト: ‘\n’)
' 
'     /w, /equal-width
'         桁数を揃えるために (先頭を) 0 で埋める。
' 
'     /?, /help
'         使用法のメッセージを標準出力に表示し、正常終了する。
' 
'     /v, /version
'         バージョン情報を標準出力に表示し、正常終了する。
' 
' 注意
'     小数値は正確に計算できない。
' ==============================================================================
option explicit

' ==========
' parameters
' ==========
dim sep, width
sep = Chr(10)
width = false


' ========================
' parse arguments(options)
' ========================
dim arg, i
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if Left(arg, 1) <> "/" then exit do
    
    select case arg
    'case "/f", "/format"
    case "/s", "/separator"
        i = i + 1
        if i >= WScript.Arguments.Count then call WScript.Quit(1)
        sep = WScript.Arguments.Item(i)
    case "/w", "/equal-width"
        width = true
    case "/?", "/help"
        call WScript.Echo("単調増加 (減少) する数値列を表示する")
        call WScript.Echo("Usage: seq [/w] [/s SEP] [/equal-width] [/separator SEP] <LAST | FIRST LAST | FIRST INCR LAST>")
        call WScript.Echo("Usage: seq [/?] [/help] [/v] [/version]")
        call WScript.Quit(0)
    case "/v", "/version"
        call WScript.Echo("seq version 0.1")
        call WScript.Quit(0)
    end select
    i = i + 1
loop


' ==================================
' parse arguments(first, last, incr)
' ==================================
dim first, incr, last
first = 1
incr = 1
last = 1
select case WScript.Arguments.Count - i
case 1
    last = WScript.Arguments.Item(i)
case 2
    first = WScript.Arguments.Item(i)
    last = WScript.Arguments.Item(i + 1)
case 3
    first = WScript.Arguments.Item(i)
    incr = WScript.Arguments.Item(i + 1)
    last = WScript.Arguments.Item(i + 2)
case else
    call WScript.StdErr.WriteLine("seq: missing operand")
    call WScript.StdErr.WriteLine("seq /? を実行してください")
    call WScript.Quit(1)
end select


' ==========
' calc width
' ==========
dim inte, deci
inte = max(len_inte(first), len_inte(incr), len_inte(last)) ' largest integer part length
deci = max(len_deci(first), len_deci(incr), len_deci(last)) ' largest decimal part length


' ====================
' arguments error trap
' ====================
on error resume next
first = cdbl(first)
if err.number <> 0 then call WScript.StdErr.WriteLine("seq: invalid number argument: " & first): call WScript.Quit(1)

last = cdbl(last)
if err.number <> 0 then call WScript.StdErr.WriteLine("seq: invalid number argument: " & last): call WScript.Quit(1)

incr = cdbl(incr)
if err.number <> 0 then call WScript.StdErr.WriteLine("seq: invalid number argument: " & incr): call WScript.Quit(1)
on error goto 0

if cdbl(incr) = 0 then call WScript.Quit(1)
if cdbl(first) > cdbl(last) and cdbl(incr) > 0 then call WScript.Quit(1)
if cdbl(first) < cdbl(last) and cdbl(incr) < 0 then call WScript.Quit(1)


' ===============
' output sequence
' ===============
dim distance, progress, stdout
set stdout = WScript.Stdout
i = first
distance = abs(last - first)
progress = 0 ' 進捗ダメです＞＜
do while progress <= distance
    if width then
        call printf(cstr(i), inte, deci)
    else
        call stdout.Write(i)
    end if
    call stdout.Write(sep)
    i = round(i + incr, deci)
    progress = abs(first - i)
loop


' ================
' define functions
' ================
function max(byval a, byval b, byval c)
    max = a
    if max < b then max = b
    if max < c then max = c
end function

function len_inte(byval strnum)
    dim point
    point = inStr(strnum, ".")
    if point > 0 then
        len_inte = point - 1
    else
        len_inte = len(strnum)
    end if
end function

function len_deci(byval strnum)
    dim point
    point = inStr(strnum, ".")
    if point > 0 then
        len_deci = len(strnum) - point
    else
        len_deci = 0
    end if
end function

function printf(byval num, byval inte_length, byval deci_length)
    dim sign, inte, deci
    sign = 1
    inte = fix(num)
    deci = round(num - inte, deci_length)
    
    if num < 0 then sign = -1: inte = -inte
    
    dim stdout
    set stdout = WScript.Stdout
    if sign < 0 then
        call stdout.Write("-")
        call stdout.Write(lpad(cstr(inte), inte_length - 1))
    else
        call stdout.Write(lpad(cstr(inte), inte_length))
    end if
    
    if deci <> 0 then
        call stdout.Write(".")
        call stdout.Write(rpad(mid(abs(cstr(deci)), 3), deci_length))
    elseif deci_length > 0 then
        call stdout.Write(".")
        call stdout.Write(rpad("0", deci_length))
    end if
end function

function lpad(byval str, byval length)
    lpad = str
    do while len(lpad) < length
        lpad = "0" & lpad
    loop
end function

function rpad(byval str, byval length)
    rpad = str
    do while len(rpad) < length
        rpad = rpad & "0"
    loop
end function
