' [Usage]
' 名前
'        head - ファイルの最初の部分を表示する
' 
' 書式
'        head [/c CHARS] [/n LINES] [/chars CHARS] [/lines LINES] [/quiet] [/silent] [/verbose] [FILE...]
' 
'        head [/?] [/help] [/version]
' 
' 説明
'        head は引数に指定された FILE の最初の部分 (デフォルトは 10 行) を表示する。 
'        FILE が 1 つも与えられないと標準入力から読み込む。
'        また FILE が ‘-’ だった場合には、そのファイルには標準入力が用いられる。
' 
'        複数の FILE が指定されたときは， head はそれぞれの前に、以下の内容の 1 行のヘッダを各ファイルの前に出力する:
' 
'             ==> FILENAME <==
' 
' オプション
'        /c CHARS, --chars CHARS
'               行単位ではなく、先頭の文字数 CHARS を表示する。
' 
'        /n LINES, /lines LINES
'               最初の LINES 行を表示する。
' 
'        /q, /quiet, /silent
'               ファイル名のヘッダを出力しない。
' 
'        /v, /verbose
'               常にファイル名のヘッダを出力する。
' 
'        /help
'               標準出力に使用方法のメッセージを出力して正常終了する。
' 
'        /version
'               標準出力にバージョン情報を出力して正常終了する。
' 
' 注意
'       バイト単位の出力はできない。

' [Version]
' head.vbs version 0.1

option explicit
' ==========
' parameters
' ==========
dim n, verbose, line_mode
n = 10
verbose = false
line_mode = true


' ========================
' parse arguments(options)
' ========================
dim i, arg
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if Left(arg, 1) <> "/" then exit do
    select case arg
    case "//", "--"
        exit do
    case "/c", "/chars"
        i = i + 1
        if not i < WScript.Arguments.Count then call WScript.Quit(1)
        n = cint(WScript.Arguments.Item(i))
        line_mode = false
    case "/n", "/lines"
        i = i + 1
        if not i < WScript.Arguments.Count then call WScript.Quit(1)
        n = cint(WScript.Arguments.Item(i))
        line_mode = true
    case "/v", "/verbose"
        verbose = true
    case "/q", "/quiet", "/silent"
        verbose = false
    case "/?", "/help"
        call view("Usage")
        call WScript.Quit(0)
    case "/version"
        call view("Version")
        call WScript.Quit(0)
    case else
        call WScript.Echo("未知のオプション'" & arg & "'が指定されました。")
        call WScript.Quit(1)
    end select
    i = i + 1
loop


' ======================
' parse arguments(files)
' ======================
dim fso, file, files
set fso = CreateObject("Scripting.FileSystemObject")
set files = CreateObject("Scripting.Dictionary")
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    on error resume next
    if arg = "-" then
        arg = "StdIn"
        set file = WScript.StdIn
    else
        set file = fso.OpenTextFile(arg)
    end if
    if err.number <> 0 then
        call WScript.StdErr.WriteLine("ファイルオープンに失敗しました。'" & arg & "'")
        call err.clear()
    else
        call files.Add(arg, file)
    end if
    on error goto 0
    i = i + 1
loop
if files.Count < 1 then call files.Add("StdIn", WScript.StdIn)

' ======
' output
' ======
dim fileName
for each fileName in files
    if verbose then call WScript.Echo("==> " & fileName & " <==")
    set file = files.Item(fileName)
    i = 0
    if line_mode then
        do while i < n
            if file.AtEndOfStream then exit do
            call WScript.Stdout.WriteLine(file.ReadLine())
            i = i + 1
        loop
        do while not file.AtEndOfStream
            call file.ReadLine()
        loop
        call file.Close()
    else
        do while i < n
            if file.AtEndOfStream then exit do
            call WScript.Stdout.Write(file.Read(1))
            i = i + 1
        loop
        do while not file.AtEndOfStream
            call file.Read(1)
        loop
        call file.Close()
    end if
    if verbose and files.Count > 1 then call WScript.Echo("")
next

call WScript.Quit(0)


' ======
' define
' ======
function view(byval label)
    dim fso, stream, line
    set fso = CreateObject("Scripting.FileSystemObject")
    set stream = fso.OpenTextFile(WScript.ScriptFullName)
    do while not stream.AtEndOfStream
        line = stream.ReadLine()
        if line = "' " & label then
            do while not stream.AtEndOfStream
                line = stream.ReadLine()
                if left(line, 1) <> "'" then exit do
                call WScript.Stdout.WriteLine(mid(line, 3))
            loop
        end if
    loop
end function