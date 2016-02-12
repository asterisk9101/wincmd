' [Usage]
' 名前
'     uniq - ソートされたファイルから重なった行を削除する
' 
' 書式
'     uniq [/c] [/i] [d] [u] [INFILE]
'     uniq [/?] [/help] [/v] [/version]
' 
' 説明
'     uniq は指定された INFILE にあるユニークな (＝他と内容の重ならない) 行を
'     標準出力に書き出す。
'     INFILE が与えられなかったり ‘-’ だった場合には、標準入力が用いられる。
' 
'     デフォルトでは、 uniq はソートされたファイルにあるユニークな行を表示する。
' 
'     /c, /count
'         それぞれの行が何回現われたかを行の内容とともに表示する。
' 
'     /i, /ignore-case
'         比較の際に英大文字小文字の違いを無視する。
' 
'     /d, /repeat
'         同じ内容が 2 行以上あるものだけを出力する。
'         /unique と同時に指定された場合は /repeat が優先される。
' 
'     /u, /unique
'         1 回しか現われない行だけを出力する。
'         /repeat と同時に指定された場合は /repeat が優先される。
' 
'     /?, /help
'         標準出力に使用方法のメッセージを出力して正常終了する。
' 
'     /v, /version
'         標準出力にバージョン情報を出力して正常終了する。

' [Version]
' uniq.vbs version 0.1

' ============
' parameters
' ============
dim infile, count, ignoreCase, repeat
infile = "-"
count = false
ignoreCase = false
repeat = false
unique = false


' ============
' parse options
' ============
dim i, arg
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if Left(arg, 1) <> "/" then exit do
    select case arg
    case "//", "--"
        exit do
    case "/c", "/count"
        count = true
    case "/i", "/ignore-case"
        ignoreCase = true
    case "/d", "/repeat"
        repeat = true
    case "/u", "/unique"
        unique = true
    case "/?", "/help"
        call view("Usage")
        call WScript.Quit(0)
    case "/v", "/version"
        call view("Version")
        call WScript.Quit(0)
    case else
        call WScript.StdErr.WriteLine("uniq: invalid argument. '" & arg & "'")
        call WScript.Quit(1)
    end select
    i = i + 1
loop


' ==============
' parse argument
' ==============
if i < WScript.Arguments.Count then
    infile = WScript.Arguments.Item(i)
end if


' ============
' get input
' ============
dim file, fso
set fso = CreateObject("Scripting.FileSystemObject")
if infile = "-" then
    set file = WScript.StdIn
else
    on error resume next
    set file = fso.OpenTextFile(infile)
    if err.number <> 0 then
        call WScript.StdErr.WriteLine("uniq: open file failed: '" & infile & "'")
        call WScript.Quit(1)
    end if
    on error goto 0
end if


' ============
' main
' ============
dim line, n, next_line

' empty file
if file.AtEndOfStream then call WScript.Quit(0)

' 1 line
n = 1
line = file.ReadLine()
if file.AtEndOfStream and not repeat then
    call output(line, n, count)
end if

' 2 line more over
do while not file.AtEndOfStream
    do while not file.AtEndOfStream
        next_line = file.ReadLine()
        if line = next_line then
            n = n + 1
        else
            exit do
        end if
    loop
    
    if repeat then
        if num <> 1 then call output(line, n, count)
    elseif unique then
        if num = 1 then call output(line, n, count)
    else
        call output(line, n, count)
    end if
    
    if file.AtEndOfStream and line <> next_line then
        if not repeat then call output(next_line, 1, count)
    end if
    
    n = 1
    line = next_line
loop

' ======
' exit
' ======
call WScript.Quit(0)


' ======
' define
' ======
function view(byval label)
    dim fso, satream, line
    set fso = CreateObject("Scripting.FileSystemObject")
    set stream = fso.OpenTextFile(WScript.ScriptFullName)
    do while not stream.AtEndOfStream
        line = stream.ReadLine()
        if line = "' [" & label & "]" then
            do while not stream.AtEndOfStream
                line = stream.ReadLine()
                if left(line, 1) <> "'" then exit do
                call WScript.Stdout.WriteLine(mid(line, 3))
            loop
        end if
    loop
end function

function compare(byval before, byval line, byval ignoreCase)
    if ignoreCase then
        if lcase(before) = lcase(line) then
            compare = true
        else
            compare = false
        end if
    else
        if before = line then
            compare = true
        else
            compare = false
        end if
    end if
end function

function output(byval line, byval num, byval count)
    if count then
        call WScript.StdOut.WriteLine(num & " " & line)
    else
        call WScript.StdOut.WriteLine(line)
    end if
end function
