' 名前
'        tail - ファイルの末尾部分を表示する
' 
' 書式
'        tail [OPTION]... [FILE]...
' 
' 説明
'        それぞれの FILE の末尾 10 行を標準出力へ出力する。
'        複数の FILE が与えられた場合は、与えられたファイル名をヘッダとして先に出力する。
'        FILE が与えられなかった場合、あるいは FILE が - の場合には標準入力から読み込む。
' 
'        /c, /chars K
'               末尾 K 文字を出力する; 各ファイルの K 文字目から出力を開始するには、代わりに +K を使う。
' 
'        /f, /follow
'               ファイルの内容が増え続ける時、追加されたデータを出力する。
' 
'        /F
'               /follow /retry と等価である。
' 
'        /n, /lines K
'               末尾 10 行の代わりに末尾 K 行を出力する; 各ファイルの K 行目から出力を開始するには、代わりに +K を使う。
' 
'        /q, /quiet, /silent
'               与えられたファイル名をヘッダとして出力しない。
' 
'        /retry
'               ファイルがアクセスできない、あるいはアクセスできなくなろうとしていたとしても、
'               ファイルのオープンを繰り返す; /follow で追跡している場合に有用である。
' 
'        /s, /sleep-interval N
'               -f と共に使用する。追跡しているファイルのチェックを N 秒毎に行う。 (デフォルトは 1.0 秒)
' 
'        /v, /verbose
'               与えられたファイル名を常にヘッダとして出力する。
' 
'        /help このヘルプを表示して終了する。
' 
'        /version
'               バージョン情報を表示して終了する。
' 
' 注意
'       ファイル記述子を使った追跡はできない。常にファイル名を使用する。
' 
' ======================================================================================================================

option explicit

' ==========
' parameters
' ==========
dim line_mode, n, verbose, retry, follow, interval
line_mode = true
n = "10"
verbose = false
retry = false
follow = false
interval = 1


' ========================
' parse arguments(options)
' ========================
dim i, arg
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if Left(arg, 1) <> "/" then exit do
    select case arg
    case "/c", "/chars"
        i = i + 1
        if not i < WScript.Arguments.Count then call WScript.Quit(1)
        n = WScript.Arguments.Item(i)
        arg = clng(n)  ' force error check, still chars is string
        line_mode = false
    case "/n", "/lines"
        i = i + 1
        if not i < WScript.Arguments.Count then call WScript.Quit(1)
        n = WScript.Arguments.Item(i)
        arg = clng(n) ' force error check, still lines is string
        line_mode = true
    case "/s", "/sleep-interval"
        i = i + 1
        if not i < WScript.Arguments.Count then call WScript.Quit(1)
        interval = clng(WScript.Arguments.Item(i))
    case "/retry"
        retry = true
    case "/f", "/follow"
        follow = true
    case "/v", "/verbose"
        verbose = true
    case "/q", "/quiet", "/silent"
        verbose = false
    case "/?", "/help"
        call WScript.Echo("")
        call WScript.Quit(0)
    case "/version"
        call WScript.Echo("head version 0.1")
        call WScript.Quit(0)
    case else
        call WScript.Echo("未知のオプション'" & arg & "'が指定されました。")
        call WScript.Quit(1)
    end select
    i = i + 1
loop

' =====================
' parse arguments(list)
' =====================
dim list
set list = CreateObject("System.Collections.ArrayList")
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    call list.Add((new FileHandle).init(arg, line_mode))
    i = i + 1
loop
if list.Count < 1 then call list.Add((new FileHandle).init("-", line_mode))

' ============
' output phase
' ============
dim fso, handle
set fso = CreateObject("Scripting.FileSystemObject")
i = 0
do while i < list.Count
    set handle = list.Item(i)
    on error resume next
    if Left(n, 1) = "+" then
        if verbose or list.Count > 0 then call WScript.Echo("==> " & handle.GetName() & " <==")
        call handle.skipTail(clng(n))
        if err.number <> 0 then if not retry then call list.RemoveAt(i): i = i - 1: call err.clear()
        if verbose or list.Count > 0 then call WScript.Echo("")
    else
        if verbose or list.Count > 0 then call WScript.Echo("==> " & handle.GetName() & " <==")
        call handle.tail(clng(n))
        if err.number <> 0 then if not retry then call list.RemoveAt(i): i = i - 1: call err.clear()
        if verbose or list.Count > 0 then call WScript.Echo("")
    end if
    if handle.GetName() = "-" then call list.RemoveAt(i): i = i - 1
    on error goto 0
    i = i + 1
loop

dim current
set current = handle

' ============
' follow phase
' ============
dim missings
set missings = CreateObject("System.Collections.ArrayList")
if follow then
    do while true
        i = 0
        do while list.Count > 0 and i < list.Count
            set handle = list.Item(i)
            if not handle.isExists() then
                call WScript.StdErr.WriteLine("File not found. '" & handle.GetName() & "'")
                call list.Remove(handle)
                i = i - 1
                call missinglist.Add(handle)
            elseif handle.isReplaced() then
                call WScript.StdErr.WriteLine("File replaced. '" & handle.GetName() & "'")
                if not current is handle and verbose then _
                    call WScript.Echo(vbCrLf & "==> " & handle.GetName() & " <==")
                call handle.TailAll(0)
                set current = handle
            elseif handle.isModified() then
                if not current is handle and verbose then _
                    call WScript.Echo(vbCrLf & "==> " & handle.GetName() & " <==")
                call handle.tailFollow()
                set current = handle
            end if
            i = i + 1
        loop
        
        i = 0
        do while missings.Count > 0 and i < missings.Count
            set handle = missings.Item(i)
            if handle.isExists() then
                call list.Add(handle)
                call missing.Remove(handle)
                i = i - 1
            end if
            i = i + 1
        loop
        
        call WScript.Sleep(interval)
    loop
end if

' TODO 前回見つからなかったファイルは、次のループで存在確認し、それでも無ければ何も表示しない
' TODO 複数ファイルだった場合は silent オプションが無い場合はファイル名を表示する

' ====
' exit
' ====
call WScript.Quit(0)


' ============
' define
' ============
class FileHandle
    private pfso
    private line_mode
    private file_name
    
    private current_pos
    private modified
    private created
    private file_exists
    
    public function GetName()
        GetName = file_name
    end function
    
    public function init(byval n, byval m)
        line_mode = m
        file_name = n
        
        current_pos = 0
        
        if isEmpty(fso) then
            set pfso = CreateObject("Scripting.FileSystemObject")
        else
            set pfso = fso
        end if
        
        if pfso.FileExists(file_name) then
            created = pfso.GetFile(file_name).DateCreated
            modified = pfso.GetFile(file_name).DateLastModified
            file_exists = true
        else
            if file_name <> "-" then call WScript.StdErr.WriteLine("File not found. '" & file_name & "'")
            created = #1900/1/1#
            modified = #1900/1/1#
            file_exists = false
        end if
        
        set init = me
    end function
    
    public function skipTail(byval n)
        ' open stream
        dim file
        if file_name = "-" then
            set file = WScript.StdIn
        else
            if not pfso.FileExists(file_name) then
                call err.raise(12345, TypeName(me), "File not found. '" & file_name & "'")
            end if
            set file = fso.OpenTextFile(file_name)
        end if
        
        ' skip and write to stream
        if line_mode then
            current_pos = skipTail_lineMode(file, n)
        else
            current_pos = skipTail_charMode(file, n)
        end if
    end function
    
    private function skipTail_lineMode(byval stream, byval n)
        dim i
        i = 0
        do while not stream.AtEndOfStream
            if i = n then exit do
            call stream.ReadLine()
            i = i + 1
        loop
        
        do while not stream.AtEndOfStream
            call WScript.Stdout.WriteLine(stream.ReadLine())
            i = i + 1
        loop
        skipTail_lineMode = i
    end function
    
    private function skipTail_charMode(byval stream, byval n)
        dim i
        i = 0
        do while not stream.AtEndOfStream
            if i = n then exit do
            call stream.Read(1)
            i = i + 1
        loop
        
        do while not stream.AtEndOfStream
            call WScript.Stdout.Write(stream.Read(1))
            i = i + 1
        loop
        skipTail_charMode = i
    end function
    
    
    public function tail(byval n)
        dim file
        
        ' open stream
        if file_name = "-" then
            set file = WScript.StdIn
        else
            if not pfso.FileExists(file_name) then
                call err.raise(12345, TypeName(me), "File not found. '" & file_name & "'")
            end if
            set file = pfso.OpenTextFile(file_name)
        end if
        
        ' output tail data
        if line_mode then
            call tail_lineMode(file, n)
        else
            call tail_charMode(file, n)
        end if
    end function
    
    private function tail_lineMode(byval stream, byval n)
        dim buf
        redim buf(n - 1)
        
        dim i
        i = 0
        do while not stream.AtEndOfStream
            buf(i mod n) = stream.ReadLine()
            i = i + 1
        loop
        call stream.Close()
        current_pos = i
        
        dim term
        term = i mod n
        if i < n then
            i = 0
        else
            i = (i + 1) mod n
        end if
        do while i <> term
            call WScript.Stdout.WriteLine(buf(i))
            i = (i + 1) mod n
        loop
    end function
    
    private function tail_charMode(byval stream, byval n)
        dim buf
        redim buf(n - 1)
        
        dim i
        i = 0
        do while not stream.AtEndOfStream
            buf(i mod n) = stream.Read(1)
            i = i + 1
        loop
        call stream.Close()
        current_pos = i
        
        dim term
        term = i mod n
        if i < n then
            i = 0
        else
            i = (i + 1) mod n
        end if
        do while term <> i
            call WScript.Stdout.Write(buf(i))
            i = (i + 1) mod n
        loop
    end function
    
    public function isExists()
        if file_name = "-" then
            isExists = true
        else
            isExists = pfso.FileExists(file_name)
        end if
    end function
    
    public function isReplaced()
        isReplaced = false
        if not pfso.FileExists(file_name) then exit function
        
        dim d
        d = pfso.GetFile(file_name).DateCreated
        if created < d then
            isReplaced = true
            created = d
        end if
    end function
    
    public function isModified()
        isModified = false
        if not pfso.FileExists(file_name) then exit function
        
        dim d
        d = pfso.getFile(file_name).DateLastModified
        if modified < d then
            isModified = true
            modified = d
        end if
    end function
    
    public function tailAll()
        call init(file_name, line_mode)
        call skipTail(0)
    end function
    
    public function tailFollow()
        ' open stream
        dim file
        if not pfso.FileExists(file_name) then _
            call err.raise(12345, TypeName(me), "File not found. '" & file_name & "'")
        set file = fso.OpenTextFile(file_name)
        
        ' skip and write to stream
        dim pos
        if line_mode then
            pos = skipTail_lineMode(file, current_pos)
            if pos =< current_pos then _
                call WScript.StdErr.WriteLine("cut")
        else
            pos = skipTail_charMode(file, current_pos)
            if pos =< current_pos then _
                call WScript.StdErr.WriteLine("cut")
        end if
        current_pos = pos + 1
    end function
end class
