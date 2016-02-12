' [Usage]
' ���O
'     uniq - �\�[�g���ꂽ�t�@�C������d�Ȃ����s���폜����
' 
' ����
'     uniq [/c] [/i] [d] [u] [INFILE]
'     uniq [/?] [/help] [/v] [/version]
' 
' ����
'     uniq �͎w�肳�ꂽ INFILE �ɂ��郆�j�[�N�� (�����Ɠ��e�̏d�Ȃ�Ȃ�) �s��
'     �W���o�͂ɏ����o���B
'     INFILE ���^�����Ȃ������� �e-�f �������ꍇ�ɂ́A�W�����͂��p������B
' 
'     �f�t�H���g�ł́A uniq �̓\�[�g���ꂽ�t�@�C���ɂ��郆�j�[�N�ȍs��\������B
' 
'     /c, /count
'         ���ꂼ��̍s�����񌻂�ꂽ�����s�̓��e�ƂƂ��ɕ\������B
' 
'     /i, /ignore-case
'         ��r�̍ۂɉp�啶���������̈Ⴂ�𖳎�����B
' 
'     /d, /repeat
'         �������e�� 2 �s�ȏ゠����̂������o�͂���B
'         /unique �Ɠ����Ɏw�肳�ꂽ�ꍇ�� /repeat ���D�悳���B
' 
'     /u, /unique
'         1 �񂵂������Ȃ��s�������o�͂���B
'         /repeat �Ɠ����Ɏw�肳�ꂽ�ꍇ�� /repeat ���D�悳���B
' 
'     /?, /help
'         �W���o�͂Ɏg�p���@�̃��b�Z�[�W���o�͂��Đ���I������B
' 
'     /v, /version
'         �W���o�͂Ƀo�[�W���������o�͂��Đ���I������B

' [Version]
' uniq.vbs version 0.1

' ============
' parameters
' ============
dim infile, count, ignoreCase, repeat
infile = "-"
count = false
ignoreCase = false
repeat = false
unique = false


' ============
' parse options
' ============
dim i, arg
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if Left(arg, 1) <> "/" then exit do
    select case arg
    case "//", "--"
        exit do
    case "/c", "/count"
        count = true
    case "/i", "/ignore-case"
        ignoreCase = true
    case "/d", "/repeat"
        repeat = true
    case "/u", "/unique"
        unique = true
    case "/?", "/help"
        call view("Usage")
        call WScript.Quit(0)
    case "/v", "/version"
        call view("Version")
        call WScript.Quit(0)
    case else
        call WScript.StdErr.WriteLine("uniq: invalid argument. '" & arg & "'")
        call WScript.Quit(1)
    end select
    i = i + 1
loop


' ==============
' parse argument
' ==============
if i < WScript.Arguments.Count then
    infile = WScript.Arguments.Item(i)
end if


' ============
' get input
' ============
dim file, fso
set fso = CreateObject("Scripting.FileSystemObject")
if infile = "-" then
    set file = WScript.StdIn
else
    on error resume next
    set file = fso.OpenTextFile(infile)
    if err.number <> 0 then
        call WScript.StdErr.WriteLine("uniq: open file failed: '" & infile & "'")
        call WScript.Quit(1)
    end if
    on error goto 0
end if


' ============
' main
' ============
dim line, n, next_line

' empty file
if file.AtEndOfStream then call WScript.Quit(0)

' 1 line
n = 1
line = file.ReadLine()
if file.AtEndOfStream and not repeat then
    call output(line, n, count)
end if

' 2 line more over
do while not file.AtEndOfStream
    do while not file.AtEndOfStream
        next_line = file.ReadLine()
        if line = next_line then
            n = n + 1
        else
            exit do
        end if
    loop
    
    if repeat then
        if num <> 1 then call output(line, n, count)
    elseif unique then
        if num = 1 then call output(line, n, count)
    else
        call output(line, n, count)
    end if
    
    if file.AtEndOfStream and line <> next_line then
        if not repeat then call output(next_line, 1, count)
    end if
    
    n = 1
    line = next_line
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

function compare(byval before, byval line, byval ignoreCase)
    if ignoreCase then
        if lcase(before) = lcase(line) then
            compare = true
        else
            compare = false
        end if
    else
        if before = line then
            compare = true
        else
            compare = false
        end if
    end if
end function

function output(byval line, byval num, byval count)
    if count then
        call WScript.StdOut.WriteLine(num & " " & line)
    else
        call WScript.StdOut.WriteLine(line)
    end if
end function
