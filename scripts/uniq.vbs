' [Usage]
' ���O
'     uniq - �\�[�g���ꂽ�t�@�C������d�Ȃ����s���폜����
' 
' ����
'     uniq [INFILE]
'     uniq [/?] [/help] [/v] [/version]
' 
' ����
'     uniq �͎w�肳�ꂽ INFILE �ɂ��郆�j�[�N�� (�����Ɠ��e�̏d�Ȃ�Ȃ�) �s��
'     �W���o�͂ɏ����o���B
'     INFILE ���^�����Ȃ������� �e-�f �������ꍇ�ɂ́A�W�����͂��p������B
' 
'     �f�t�H���g�ł́A uniq �̓\�[�g���ꂽ�t�@�C���ɂ��郆�j�[�N�ȍs��\������B
' 
'     /?, /help
'         �W���o�͂Ɏg�p���@�̃��b�Z�[�W���o�͂��Đ���I������B
' 
'     /v, /version
'         �W���o�͂Ƀo�[�W���������o�͂��Đ���I������B

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
