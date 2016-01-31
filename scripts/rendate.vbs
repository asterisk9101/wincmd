' [Usage]
' 名前
'     rendate - ファイル名に日付を付与する
' 
' 書式
'     rendate FILE
'     rendate [/?] [/help] [/v] [/version]
' 
' 説明
'     FILE に与えられたファイル名に日付を付与する。
'     デフォルトでは、FILE_yyyymmdd.ext になる。
' 
'     /s
'         リネーム書式を FILE_yyyymmdd_hhmsss.ext に変更する。
' 
'     /?, /help
'         使い方を表示して正常終了する。
' 
'     /v, /version
'         バージョン情報を表示して正常終了する。

' [Version]
' rendate.vbs version 0.1

option explicit

dim hhmiss
hhmiss = false

dim arg, i
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if left(arg, 1) <> "/" then exit do
    select case arg
    case "/s" hhmiss = true
    case "/?", "/help"
        call view("Usage")
        call WScript.Quit(0)
    case "/v", "/version"
        call view("Version")
        call WScript.Quit(0)
    case else call err.raise(12345, "rendate", "invalid option name. '" & arg & "'")
    end select
    i = i + 1
loop

dim files
set files = CreateObject("System.Collections.ArrayList")
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    call files.Add(arg)
    i = i + 1
loop

dim fso
set fso = CreateObject("Scripting.FileSystemObject")

dim dir, name, ext, mdate, yyyy, mm, dd, hh, mi, ss

dim file, newName
for each file in files
    if fso.FileExists(file) then
        file = fso.GetAbsolutePathName(file)
        
        dir = fso.GetParentFolderName(file)
        name = fso.GetBaseName(file)
        ext = fso.GetExtensionName(file)
        
        mdate = fso.GetFile(file).DateLastModified
        yyyy = "" & year(mdate)
        mm = right("0" & month(mdate), 2)
        dd = right("0" & day(mdate), 2)
        hh = right("0" & hour(mdate), 2)
        mi = right("0" & minute(mdate), 2)
        ss = right("0" & second(mdate), 2)
        if hhmiss then
            newName = fso.BuildPath(dir, name) & "_" & yyyy & mm & dd & "_" & hh & mi & ss & "." & ext
            call fso.MoveFile(file, newName)
        else
            newName = fso.BuildPath(dir, name) & "_" & yyyy & mm & dd & "." & ext
            call fso.MoveFile(file, newName)
        end if
        call WScript.Echo(newName)
    else
        call WScript.StdErr.WriteLine("File not found. '" & file & "'")
    end if
next

' ======
' define
' ======
function view(byval label)
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
