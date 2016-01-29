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
' ======================================================================================================================

option explicit
' ==========
' parameters
' ==========
dim chars, lines, verbose
chars = 0
lines = 10
verbose = false


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
        chars = cint(WScript.Arguments.Item(i))
        lines = 0
    case "/n", "/lines"
        i = i + 1
        if not i < WScript.Arguments.Count then call WScript.Quit(1)
        lines = cint(WScript.Arguments.Item(i))
        chars = 0
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
    if lines <> 0 then
        do while i < lines
            if file.AtEndOfStream then exit do
            call WScript.Echo(file.ReadLine())
            i = i + 1
        loop
    else
        do while i < chars
            if file.AtEndOfStream then exit do
            call WScript.Echo(file.Read(1))
            i = i + 1
        loop
    end if
    call file.Close()
    if verbose and files.Count > 1 then call WScript.Echo("")
next

call WScript.Quit(0)

