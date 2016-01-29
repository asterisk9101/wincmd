dim fso, shell
set fso = CreateObject("Scripting.FileSystemObject")
set shell = CreateObject("WScript.Shell")

dim item
for each item in split(shell.ExpandEnvironmentStrings("%PATH%"), ";")
    fso
next