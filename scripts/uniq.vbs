' [Usage]
' 名前
'     uniq - ソートされたファイルから重なった行を削除する
' 
' 書式
'     uniq [INFILE]
'     uniq [/?] [/help] [/v] [/version]
' 
' 説明
'     uniq は指定された INFILE にあるユニークな (＝他と内容の重ならない) 行を
'     標準出力に書き出す。
'     INFILE が与えられなかったり ‘-’ だった場合には、標準入力が用いられる。
' 
'     デフォルトでは、 uniq はソートされたファイルにあるユニークな行を表示する。
' 
'     /?, /help
'         標準出力に使用方法のメッセージを出力して正常終了する。
' 
'     /v, /version
'         標準出力にバージョン情報を出力して正常終了する。

' [Version]
' uniq.vbs version 0.1

dim infile
infile = "-"

dim i, arg
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if Left(arg, 1) <> "/" then exit do
    select case arg
    case "//", "--"
        exit do
    case "/?", "/help"
        call view("Usage")
        call WScript.Quit(0)
    case "/v", "/version"
        call view("Version")
        call WScript.Quit(0)
    end select
    i = i + 1
loop

if i < WScript.Arguments.Count then
    infile = WScript.Arguments.Item(i)
end if


dim file, fso
set fso = CreateObject("Scripting.FileSystemObject")
if infile = "-" then
    set file = WScript.StdIn
else
    on error resume next
    set file = fso.OpenTextFile(infile)
    on error goto 0
end if

dim before, line
do while not file.AtEndOfStream
    line = file.ReadLine()
    if before <> line then call WScript.Stdout.WriteLine(line)
    before = line
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
