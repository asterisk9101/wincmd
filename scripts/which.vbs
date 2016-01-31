
dim i
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if left(arg, 1) <> "/" then exit do
    select case arg
    case "/?", "/help"
    case "/v", "/version"
    case else
        call WScript.StdErr.WriteLine("which: invalid argument: " & arg)
        call WScript.Quit(1)
    end select
    i = i + 1
loop


dim cmd
if i < WScript.Arguments.Count then
    cmd = WScript.Arguments.Item(i)
end if


dim fso, shell
set fso = CreateObject("Scripting.FileSystemObject")
set shell = CreateObject("WScript.Shell")

dim env, path, folder, file, discover
env = shell.ExpandEnvironmentStrings("%PATH%")
discover = false
for each path in split(env, ";")
    if fso.FolderExists(path) then
        set folder = fso.GetFolder(path)
        for each file in folder.files
            if cmd = fso.GetBaseName(file.name) then
                call WScript.Echo(file.Path)
                discover = true
            end if
        next
    else
        call WScript.StdErr.WriteLine("which: Directory not found. '" & path & "'")
    end if
next

if not discover then
    call WScript.StdErr.WriteLine("which: no " & cmd & " in (" & env & ")")
end if
