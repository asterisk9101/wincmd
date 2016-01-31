' ==================================================================================================
' 名前
'   tee - 標準入力から読んだ内容を標準出力とファイルに書き出す
' 
' 書式
'   tee [/a] [/append] [file...]
'   tee [/?] [/help] [/v] [/version]
' 
' 説明
'   tee コマンドは標準入力を、標準出力と引数で与えられた全てのファイルとにコピーする。
'   何らかのデータをパイプに送るとき、同時にそのコピーを保存しておきたいときに便利だろう。
'   存在しないファイルに書き出そうとすると、このファイルは作成される。もしすでに存在しているファイルに
'   書き出そうとすると、 /a オプションを使わない限り、以前の内容は上書きされる。
' 
' オプション
'   /a, /append
'       ファイル内容を上書きせずに、標準入力をファイルに追加する。
'   /?, /help
'       標準出力に使用方法のメッセージを出力して正常終了する。
'   /v, /version
'       標準出力にバージョン情報を出力して正常終了する。
' 
' 注意
'   動作には .NET Framework 1.1 以上(System.Collections.ArrayList) が必要
' 
' ==================================================================================================

option explicit

' =========
' parameter
' =========
dim iomode
iomode = 2 ' for writing
errcode = 0


' ========================
' parse arguments(options)
' ========================
dim i, arg
i = 0
do while i < WScript.Arguments.count
    arg = WScript.Arguments.Item(i)
    if left(arg, 1) <> "/" then exit do
    select case arg
    case "/a", "/append"
        iomode = 8 ' for appending
    case "/?", "/help"
        call WScript.Echo("tee - 標準入力から読んだ内容を標準出力とファイルに書き出す")
        call WScript.Echo("使用法： tee [option]... [file]...")
        call WScript.Quit(0)
    case "/v", "/version"
        call WScript.Echo("tee version 0.1")
        call WScript.Quit(0)
    case else
        call WScript.Echo("未知のオプション '" & arg & "' が指定されました。")
        call WScript.Quit(1)
    end select
    i = i + 1
loop


' =============================
' parse arguments(output files)
' =============================
dim fso, file, files, errcode
set fso = CreateObject("Scripting.FileSystemObject")
set files = CreateObject("System.Collections.ArrayList")
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    on error resume next
        set file = fso.OpenTextFile(arg, iomode, true)
        if err.number <> 0 then
            call WScript.StdErr.WriteLine( _
                "[" & err.number & "] " & err.description & _
                "'" & fso.GetAbsolutePathName(arg) & "'")
            errcode = err.number
        else
            call files.Add(file)
        end if
    on error goto 0
    i = i + 1
loop


' ================================
' output stdin to stdout and files
' ================================
dim stdin, line
set stdin = WScript.Stdin
do while not stdin.AtEndOfStream
    line = stdin.ReadLine()
    call WScript.Echo(line)
    for each file in files
        call file.WriteLine(line)
    next
loop

call WScript.Quit(errcode)
