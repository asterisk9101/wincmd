' 名前
'     wc - ファイルの文字数・単語数・行数を表示する
' 
' 書式
'     wc [/c] [/l] [/w] [/L] [/chars] [/lines] [/max-line-length] [/words] [FILE]...
'     wc [/?] [/help] [/v] [/version]
' 
' 説明
'     wc は指定された各 FILE の文字数・空白で区切られた単語の数・行数を数える。 
'     FILE が一つも与えられないと標準入力から読み込む。
'     また FILE が ‘-’ だった場合には、そのファイルには標準入力が用いられる。
' 
'     デフォルトでは、 wc は 3 つ全てを出力する。
'     オプション指定により出力する項目を指定できる。
'     オプションは先に指定したものを取り消すことはできない。
'     したがって ‘wc /chars /words’ は文字数と単語数の両方を出力する。
' 
'     wc は最後の行に各 FILE のカウント数を合計して表示する。
'     結果は、改行数・単語数・文字数の順に表示される。
' 
' オプション
'     /l, /lines
'         改行数だけを出力する。
' 
'     /c, /chars
'         文字数だけを出力する。
' 
'     /w, /words
'         単語数だけを出力する。
' 
'     /L, /max-line-length
'         ファイル中の行の最大長だけを表示する。一つ以上のファイルが指定された場合は、
'         それらのうちでの最大長を表示する (合計ではない)。
' 
'     /help
'         標準出力に使用方法のメッセージを出力して正常終了する。
' 
'     /version
'         標準出力にバージョン情報を出力して正常終了する。
' 
' 注意
'     文字コードが Shift-JIS 以外の場合はうまくカウントできない。
'     改行文字も1文字としてカウントする。例えば CrLf は 2 文字としてカウントする。
'     オリジナルの wc コマンドと違ってバイト数はカウントしない。
' ======================================================================================================================

option explicit

' =================
' option parameters
' =================
dim words, lines, chars, max_line_length
words = true
lines = true
chars = true
max_line_length = false


' ========================
' parse arguments(options)
' ========================
dim arg, i
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if Left(arg, 1) <> "/" then exit do
    
    if i = 0 then
        chars = false
        words = false
        lines = false
    end if
    
    select case arg
    case "/l", "/lines" lines = true
    case "/c", "/chars" chars = true
    case "/w", "/words" words = true
    case "/L", "/max-line-length" max_line_length = true
    case "/?", "/help"
        call WScript.Echo("USAGE: wc [OPTION]... [FILE]...")
        call WScript.Echo("ファイルの文字数・単語数・行数を表示する")
        call WScript.Quit(0)
    case "/v", "/version"
        call WScript.Echo("wc version 0.1")
        call WScript.Quit(0)
    case else
        call WScript.StdErr.WriteLine("未知のオプション '" & arg & "' が指定されました。")
        call WScript.Quit(1)
    end select
    i = i + 1
loop


' =======================
' parse arguments(inputs)
' =======================
dim fso, files, file
set fso = CreateObject("Scripting.FileSystemObject")
set files = CreateObject("Scripting.Dictionary")
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if arg = "-" then
        call files.Add(arg, WScript.Stdin)
    else
        on error resume next
        set file = fso.OpenTextFile(arg)
        if err.number <> 0 then
            call WScript.StdErr.WriteLine( _
                "[" & Err.Number & "]" & Err.description & _
                "'" & fso.GetAbsolutePathName(arg) & "'")
        else
            call files.Add(arg, file)
        end if
        on error goto 0
    end if
    i = i + 1
loop
if files.Count = 0 then call files.Add("-", WScript.Stdin)


' =============================================
' count chars, words, lines and max-line-length
' =============================================
dim results, result
set results = CreateObject("Scripting.Dictionary")
for each file in files
    set result = count(files.Item(file))
    call results.Add(file, result)
next


' =============================
' output results and calc total
' =============================
dim total
set total = new resultset
for each file in results
    set result = results.Item(file)
    total.add_chars(result.chars)
    total.add_words(result.words)
    total.add_lines(result.lines)
    total.add_max_line_length(result.max_line_length)
    if chars then call WScript.Stdout.Write(result.chars & Chr(9))
    if words then call WScript.Stdout.Write(result.words & Chr(9))
    if lines then call WScript.Stdout.Write(result.lines & Chr(9))
    if max_line_length then call WScript.Stdout.Write(result.max_line_length & Chr(9))
    if files.Count > 1 then WScript.Echo(file)
next


' ============
' output total
' ============
if files.Count > 1 then
    if chars then call WScript.Stdout.Write(total.chars & Chr(9))
    if words then call WScript.Stdout.Write(total.words & Chr(9))
    if lines then call WScript.Stdout.Write(total.lines & Chr(9))
    if max_line_length then call WScript.Stdout.Write(total.max_line_length & Chr(9))
    WScript.Echo("total")
end if


' =========================
' define class and function
' =========================
class resultset
    public chars
    public words
    public lines
    public max_line_length
    private sub Class_Initialize
        chars = 0
        words = 0
        lines = 0
        max_line_length = 0
    end sub
    public function init(byval c, byval w, byval l, byval m)
        chars = c
        words = w
        lines = l
        max_line_length = m
        set init = me
    end function
    public function add_chars(byval num)
        chars = chars + num
    end function
    public function add_words(byval num)
        words = words + num
    end function
    public function add_lines(byval num)
        lines = lines + num
    end function
    public function add_max_line_length(byval num)
        max_line_length = max_line_length + num
    end function
end class

function count(byval stream)
    dim result
    set result = new resultset
    call result.init(0, 0, 0, 0)
    
    dim ch, before, width
    before = " "
    width = 0
    do while not stream.AtEndOfStream
        ch = stream.Read(1)
        width = width + 1
        
        ' count chars
        call result.add_chars(1)
        
        ' count words
        if Asc(before) <= 32 and (Asc(ch) < 0 or 32 < Asc(ch)) then
            call result.add_words(1)
        end if
        
        ' count lines, and line-length
        if before = vbLf then
            call result.add_lines(1)
            if result.max_line_length < width then result.max_line_length = width
            width = 0
        elseif before = vbCr and ch <> vbLf then
            call result.add_lines(1)
            if result.max_line_length < width then result.max_line_length = width
            width = 0
        end if
        before = ch
    loop
    
    if width > result.max_line_length then result.max_line_length = width
    if result.chars > 0 then call result.add_lines(1)
    
    set count = result
end function
