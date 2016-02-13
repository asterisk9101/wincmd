' [Usage]
' 名前
'     cut - ファイルの各行から文節をとりのぞく
' 
' 書式
'     cut [/f FIELD-LIST | /c CHARACTER-LIST] [/d DELIMITER] [/o OUTPUT-DELIMITER] [/s] [/v] [FILE...]
'     cut [/?] [/help] [/version]
' 
' 説明
'     cut は、与えられた FILE それぞれから、各行の一部を選択して標準出力に書き出す。 
'     FILE が一つも与えられないと標準入力から読み込む。また FILE が `-' だった場合には、
'     そのファイルには標準入力が用いられる。
' 
'     CHARACTER-LIST, FIELD-LIST には、一つ以上の数値か範囲 (ダッシュで接続された2つの数値) を
'     コンマで区切って指定する。バイト・文字・フィールドの番号は 1 から振られる。
' 
' オプション
'     /c CHARACTER-LIST, /characters CHARACTER-LIST
'         CHARACTER-LIST にリストされた位置の各文字だけを表示する。
'         タブやバックスペースもほかの普通の文字と同じように1文字として扱う。
' 
'     /f FIELD-LIST, /fields FIELD-LIST
'         FIELD-LIST にリストされた位置のフィールドだけ表示する。
'         フィールドの区切りはデフォルトでは <TAB> である。
' 
'     /d DELIM, /delimiter DELIM
'         区切り文字 DELIM を指定する。デフォルトは <TAB> 。
'         DELIM に指定できる文字は 1 文字だけ。
'         /f と合わせて使用する。/c と同時に指定した場合は無視される。
' 
'     /s, /silent
'         区切り文字を出力しない。
'         /f と合わせて使用する。/c と同時に指定した場合は無視される。
' 
'     /o OUT-DELIM, /output-delimiter OUT-DELIM
'         出力する区切り文字 OUT-DELIM を指定する。
'         指定しなかった場合 /d と同じ文字が使用される。
' 
'     /v, /complement
'         表示・非表示を反転する。
' 
'     /?, /help
'         標準出力に使用方法のメッセージを出力して正常終了する。
' 
'     /version
'         標準出力にバージョン情報を出力して正常終了する。
' 
' オリジナルの cut との差異
'     不完全な範囲指定(ex. -N, M-)はできない。
'     重複したフィールドの指定(ex. /f 1,1,2)ができる。
'     フィールドの入れ替え(ex. /f 2,1)ができる。

' [Version]
' cut.vbs version 0.1

option explicit

' ================
' define functions
' ================
function abort(byval m)
    ' メッセージ m をエラー出力して異常終了する。
    call WScript.StdErr.WriteLine(m)
    call WScript.Quit(1)
end function

function view(byval label)
    ' ラベル label から始まる連続したコメントを表示する。
    ' 使い方などを表示するために使用する。
    dim fso, stream, line
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

function get_next_arg(byval param, byref i)
    ' 次の引数を返す。次の引数が無ければ異常終了させる。
    ' 引数 i は、呼び出し元の値を変更する。
    if i < WScript.Arguments.Count - 1 then
        i = i + 1
    else
        call abort("cut: arguments shortage. '" & param & "'")
    end if
    get_next_arg = WScript.Arguments.Item(i)
end function

function toColNumber(byval n)
    ' 引数 n を数値に変換する。変換できなければ異常終了させる。
    if not isNumeric(n) then
        call abort("cut: invalid field name. '" & n & "'")
    end if
    toColNumber = clng(n)
end function

function parseRange(byval range)
    ' 引数 range で与えられた範囲を表す文字列を変換する。
    ' 例えば "1-3" が与えられたとき、"1,2,3" を返す。
    dim r
    r = split(range, "-")
    
    dim n
    select case ubound(r)
    case 0
        parseRange = r(0)
    case 1
        if not isNumeric(r(0)) or not isNumeric(r(1)) then
            call abort("cut: invalid range name. '" & r(0) & "-" & r(1) & "'")
        end if
        parseRange = r(0)
        for n = r(0) + 1 to r(1)
            parseRange = parseRange & "," & n
        next
    case else
        call abort("cut: invalid range range. '" & range & "'")
    end select
end function

function map(byval ary, byval func)
    ' 引数 ary で受け取った配列の各要素を、
    ' 引数 func で受け取った関数の第一引数に渡し、
    ' その返り値で新しい配列を作って返す。
    dim i
    i = 0
    do while i <= ubound(ary)
        ary(i) = func(ary(i))
        i = i + 1
    loop
    map = ary
end function

function indexOf(byval ary, byval item)
    ' 引数 ary で受け取った配列を検索し、
    ' item のある位置を返す。item が配列に存在しなければ -1 を返す。
    dim ret, i
    ret = -1
    i = 0
    do while i <= ubound(ary)
        if ary(i) = item then
            ret = i
            exit do
        end if
        i = i + 1
    loop
    indexOf = ret
end function

function uniq(byval list)
    dim newlist
    set newlist = CreateObject("System.Collections.ArrayList")
    
    if list.Count = 0 then
        set uniq = newlist
        exit function
    end if
    
    dim i
    i = 0
    set newlist = list.item(i)
    do while i < list.Count()
        if newlist.item(newlist.Count() - 1) <> list.item(i) then
            call newlist.Add(list.item(i))
        end if
        i = i + 1
    loop
    
    set uniq = newlist
end function

function toArrayList(byval ary)
    dim item, list
    set list = CreateObject("System.Collections.ArrayList")
    for each item in ary
        call list.Add(item)
    next
    set toArrayList = list
end function

function cut_delim(byval file, byval fields, byval complement, byval delim, byval silent, byval outdelim)
    ' フィールドを切り出す
    dim columns, index, line
    if complement then
        do while not file.AtEndOfStream
            set line = CreateObject("System.Collections.ArrayList")
            columns = split(file.ReadLine(), delim)
            index = 0
            do while index <= ubound(columns)
                if indexOf(fields, index + 1) = -1 then
                    call line.Add(columns(index))
                end if
                index = index + 1
            loop
            
            if silent then
                call WScript.StdOut.WriteLine(join(line.ToArray()))
            else
                call WScript.StdOut.WriteLine(join(line.ToArray(), outdelim))
            end if
        loop
    else
        do while not file.AtEndOfStream
            set line = CreateObject("System.Collections.ArrayList")
            columns = split(file.ReadLine(), delim)
            index = 0
            do while index <= ubound(fields)
                if 0 <= fields(index) - 1 and fields(index) - 1 <= ubound(columns) then
                    call line.Add(columns(fields(index) - 1))
                end if
                index = index + 1
            loop
            
            if silent then
                call WScript.StdOut.WriteLine(join(line.ToArray()))
            else
                call WScript.StdOut.WriteLine(join(line.ToArray(), outdelim))
            end if
        loop
    end if
end function

function cut_chars(byval file, byval ranges, byval complement, byval outdelim)
    ' 文字を切り出す
    if complement then
        call cut_chars_cmplement(file, ranges, outdelim)
    else
        call cut_chars_select(file, ranges, outdelim)
    end if
end function

function fill(byval ary, byval val)
    dim i
    i = 0
    do while i <= ubound(ary)
        ary(i) = val
        i = i + 1
    loop
    fill = ary
end function

function DelPosList(byval length, byval ranges)
    dim list, index
    list = Array(length) - 1
    
    ' list を true で初期化する。
    list = fill(list, true)
    
    ' ranges を展開する
    ranges = join(map(split(ranges, ","), GetRef("parseRange")), ",")
    
    ' ranges で指定された list の位置を false にする
    for each index in split(ranges, ",")
        list(index) = false
    next
    
    DelPosList = list
end function

function StringToArray(byval str)
    dim list, i
    set list = CreateObject("System.Collections.ArrayList")
    i = 1
    do while i <= len(str)
        call list.Add(mid(str, i, 1))
        i = i + 1
    loop
    StringToArray = list.ToArray()
end function

function ApplyDeletePositions(byval list, byval del_positions)
    dim i, pos
    
    ' del_position の要素を削除する
    i = 0
    do while i <= ubound(del_positions)
        pos = del_positions(i) - 1
        if -1 < pos and pos < list.Count then
            call list.RemoveAt(pos)
            call list.Insert(pos, null)
        end if
        i = i + 1
    loop
    
    set ApplyDeletePositions = list
end function

function ArrayToList(byval ary)
    dim list, item
    set list = CreateObject("System.Collections.ArrayList")
    for each item in ary
        call list.Add(item)
    next
    set ArrayToList = list
end function

function uniq(byval list)
    dim newlist, i, item
    set newlist = CreateObject("System.Collections.ArrayList")
    
    if list.Count = 0 then set uniq = newlist: exit function
    
    i = 0
    call newlist.Add(list.Item(i))
    for each item in list
        if newlist.Item(newlist.Count - 1) <> item then
            call newlist.Add(item)
        end if
    next
    
    set uniq = newlist
end function

function DelPositions(byval ranges)
    dim list
    
    ranges = join(map(ranges, GetRef("parseRange")), ",")
    
    set list = ArrayToList(split(ranges, ","))
    call list.Sort()
    set list = uniq(list)
    
    DelPositions = list.ToArray()
end function

function CompressNull(byval list)
    dim i, val, next_val, newlist
    set newlist = CreateObject("System.Collections.ArrayList")
    
    set CompressNull = newlist
    if list.Count = 0 then exit function
    call newlist.Add(list.Item(0))
    if list.Count = 1 then exit function
    
    val = list.Item(0)
    i = 1
    do while i < list.Count
        next_val = list.Item(i)
        if not isNull(val) or not isNull(next_val) then
            call newlist.Add(next_val)
        end if
        val = next_val
        i = i + 1
    loop
    
    set CompressNull = newlist
end function

function TrimNull(byval list)
    dim newlist, item
    set newlist = CreateObject("System.Collections.ArrayList")
    
    for each item in list
        call newlist.Add(item)
    next
    
    if newlist.Count = 0 then
        ' nanimosinai
    elseif list.Count = 1 then
        if isNull(newlist.Item(0)) then call newlist.RemoveAt(0)
    else
        if isNull(newlist.Item(0)) then call newlist.RemoveAt(0)
        if isNull(newlist.Item(newlist.Count - 1)) then
            call newlist.RemoveAt(newlist.Count - 1)
        end if
    end if
    
    set TrimNull = newlist
end function

function InsertDelimiter(byval list, byval outdelim)
    dim newlist, item
    set newlist = CreateObject("System.Collections.ArrayList")
    for each item in list
        call newlist.Add(item)
    next
    i = 0
    do while i < newlist.Count
        if isNull(newlist.Item(i)) then
            newlist.Item(i) = outdelim
        end if
        i = i + 1
    loop
    
    set InsertDelimiter = newlist
end function

function cut_chars_cmplement(byval file, byval ranges, byval outdelim)
    dim line, del_positions, list
    
    ' 削除する位置を求める
    del_positions = DelPositions(ranges)
    
    do while not file.AtEndOfStream
        line = file.ReadLine()
        
        ' 文字列を文字リストに変換する
        set list = ArrayToList(StringToArray(line))
        
        ' 文字リストに削除位置を適用(null)する
        set list = ApplyDeletePositions(list, del_positions)
        
        ' 連続した Null を圧縮する
        set list = CompressNull(list)
        
        ' 両端の Null を削除する
        set list = TrimNull(list)
        
        ' Null を outdelim に置換する
        set list = InsertDelimiter(list, outdelim)
        
        call WScript.StdOut.WriteLine(join(list.ToArray(), ""))
    loop
end function

function SelectRanges(byval list, byval sel_positions)
    dim cols, range, pos, col
    set cols = CreateObject("System.Collections.ArrayList")
    for each range in sel_positions
        set col = CreateObject("System.Text.StringBuilder")
        for each pos in split(range, ",")
            pos = clng(pos) - 1
            if -1 < pos and pos < list.Count then
                call col.Append_3(list.Item(pos))
            end if
        next
        call cols.Add(col.ToString())
    next
    set SelectRanges = cols
end function

function cut_chars_select(byval file, byval ranges, byval outdelim)
    dim line, sel_positions, list
    sel_positions = map(ranges, GetRef("parseRange"))
    
    do while not file.AtEndOfStream
        line = file.ReadLine()
        set list = ArrayToList(StringToArray(line))
        set list = SelectRanges(list, sel_positions)
        call WScript.StdOut.WriteLine(join(list.ToArray(), outdelim))
    loop
end function


' ================
' global variables
' ================
dim exit_code
exit_code = 0


' ==========
' parameters
' ==========
dim char_mode, delim, fields, complement, silent, outdelim
char_mode = false
fields = null
complement = false
delim = vbTab
silent = false
outdelim = delim


' =============
' parse options
' =============
dim arg, i
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if left(arg, 1) <> "/" then exit do
    select case arg
    case "/c", "/characters"
        char_mode = true
        fields = split(get_next_arg(arg, i), ",")
        outdelim = ""
    case "/d", "/delimiter"
        delim = get_next_arg(arg, i)
        outdelim = delim
        if len(delim) > 1 then
            call abort("cut: delimiter is 1cahr. '" & delim & "'")
        end if
    case "/f", "/fields"
        char_mode = false
        fields = split(get_next_arg(arg, i), ",")
        fields = map(fields, GetRef("parseRange"))  ' "1-3" -> "1,2,3"
        fields = split(join(fields, ","), ",")      ' "1,2", "3,4" -> "1,2,3,4" -> "1", "2", "3", "4"
        fields = map(fields, GetRef("toColNumber")) ' "1", "2", "3" -> 1, 2, 3
    case "/v", "/complement"
        complement = true
    case "/s", "/silent"
        silent = true
    case "/o", "/output-delimiter"
        outdelim = get_next_arg(arg, i)
    case "/?", "/help"
        call view("Usage")
        call WScript.Quit(0)
    case "/version"
        call view("Version")
        call WScript.Quit(0)
    case else
        call abort("cut: invalid arguments. '" & arg & "'")
    end select
    i = i + 1
loop

if not isArray(fields) then call abort("cut: require fields specify.")


' ===============
' parse arguments
' ===============
dim fso, inputs, file
set fso = CreateObject("Scripting.FileSystemObject")
set inputs = CreateObject("System.Collections.ArrayList")
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if arg = "-" then
        call inputs.Add("-")
    elseif fso.FileExists(fso.GetAbsolutePathName(arg)) then
        call inputs.Add(arg)
    else
        call WScript.StdErr.WriteLine("cut: not found '" & arg & "'")
        exit_code = 1
    end if
    i = i + 1
loop 

if inputs.Count = 0 then call inputs.Add("-")


' ====
' main
' ====
dim input, line
for each input in inputs
    if input = "-" then
        set file = WScript.StdIn
    else
        on error resume next
        set file = fso.OpenTextFile(fso.GetAbsolutePathName(input))
        on error goto 0
    end if
    
    if err.number <> 0 then
        call WScript.StdErr.WriteLine("cut: file open failed. '" & input & "'")
        call err.clear()
    else
        if char_mode then
            call cut_chars(file, fields, complement, outdelim)
        else
            call cut_delim(file, fields, complement, delim, silent, outdelim)
        end if
        call file.Close()
    end if
next
