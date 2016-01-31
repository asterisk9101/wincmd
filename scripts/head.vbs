' [Usage]
' ���O
'        head - �t�@�C���̍ŏ��̕�����\������
' 
' ����
'        head [/c CHARS] [/n LINES] [/chars CHARS] [/lines LINES] [/quiet] [/silent] [/verbose] [FILE...]
' 
'        head [/?] [/help] [/version]
' 
' ����
'        head �͈����Ɏw�肳�ꂽ FILE �̍ŏ��̕��� (�f�t�H���g�� 10 �s) ��\������B 
'        FILE �� 1 ���^�����Ȃ��ƕW�����͂���ǂݍ��ށB
'        �܂� FILE �� �e-�f �������ꍇ�ɂ́A���̃t�@�C���ɂ͕W�����͂��p������B
' 
'        ������ FILE ���w�肳�ꂽ�Ƃ��́C head �͂��ꂼ��̑O�ɁA�ȉ��̓��e�� 1 �s�̃w�b�_���e�t�@�C���̑O�ɏo�͂���:
' 
'             ==> FILENAME <==
' 
' �I�v�V����
'        /c CHARS, --chars CHARS
'               �s�P�ʂł͂Ȃ��A�擪�̕����� CHARS ��\������B
' 
'        /n LINES, /lines LINES
'               �ŏ��� LINES �s��\������B
' 
'        /q, /quiet, /silent
'               �t�@�C�����̃w�b�_���o�͂��Ȃ��B
' 
'        /v, /verbose
'               ��Ƀt�@�C�����̃w�b�_���o�͂���B
' 
'        /help
'               �W���o�͂Ɏg�p���@�̃��b�Z�[�W���o�͂��Đ���I������B
' 
'        /version
'               �W���o�͂Ƀo�[�W���������o�͂��Đ���I������B
' 
' ����
'       �o�C�g�P�ʂ̏o�͂͂ł��Ȃ��B

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
        call WScript.Echo("���m�̃I�v�V����'" & arg & "'���w�肳��܂����B")
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
        call WScript.StdErr.WriteLine("�t�@�C���I�[�v���Ɏ��s���܂����B'" & arg & "'")
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