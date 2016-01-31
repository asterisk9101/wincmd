' ==================================================================================================
' ���O
'   tee - �W�����͂���ǂ񂾓��e��W���o�͂ƃt�@�C���ɏ����o��
' 
' ����
'   tee [/a] [/append] [file...]
'   tee [/?] [/help] [/v] [/version]
' 
' ����
'   tee �R�}���h�͕W�����͂��A�W���o�͂ƈ����ŗ^����ꂽ�S�Ẵt�@�C���ƂɃR�s�[����B
'   ���炩�̃f�[�^���p�C�v�ɑ���Ƃ��A�����ɂ��̃R�s�[��ۑ����Ă��������Ƃ��ɕ֗����낤�B
'   ���݂��Ȃ��t�@�C���ɏ����o�����Ƃ���ƁA���̃t�@�C���͍쐬�����B�������łɑ��݂��Ă���t�@�C����
'   �����o�����Ƃ���ƁA /a �I�v�V�������g��Ȃ�����A�ȑO�̓��e�͏㏑�������B
' 
' �I�v�V����
'   /a, /append
'       �t�@�C�����e���㏑�������ɁA�W�����͂��t�@�C���ɒǉ�����B
'   /?, /help
'       �W���o�͂Ɏg�p���@�̃��b�Z�[�W���o�͂��Đ���I������B
'   /v, /version
'       �W���o�͂Ƀo�[�W���������o�͂��Đ���I������B
' 
' ����
'   ����ɂ� .NET Framework 1.1 �ȏ�(System.Collections.ArrayList) ���K�v
' 
' ==================================================================================================

option explicit

' =========
' parameter
' =========
dim iomode
iomode = 2 ' for writing
errcode = 0


' ========================
' parse arguments(options)
' ========================
dim i, arg
i = 0
do while i < WScript.Arguments.count
    arg = WScript.Arguments.Item(i)
    if left(arg, 1) <> "/" then exit do
    select case arg
    case "/a", "/append"
        iomode = 8 ' for appending
    case "/?", "/help"
        call WScript.Echo("tee - �W�����͂���ǂ񂾓��e��W���o�͂ƃt�@�C���ɏ����o��")
        call WScript.Echo("�g�p�@�F tee [option]... [file]...")
        call WScript.Quit(0)
    case "/v", "/version"
        call WScript.Echo("tee version 0.1")
        call WScript.Quit(0)
    case else
        call WScript.Echo("���m�̃I�v�V���� '" & arg & "' ���w�肳��܂����B")
        call WScript.Quit(1)
    end select
    i = i + 1
loop


' =============================
' parse arguments(output files)
' =============================
dim fso, file, files, errcode
set fso = CreateObject("Scripting.FileSystemObject")
set files = CreateObject("System.Collections.ArrayList")
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    on error resume next
        set file = fso.OpenTextFile(arg, iomode, true)
        if err.number <> 0 then
            call WScript.StdErr.WriteLine( _
                "[" & err.number & "] " & err.description & _
                "'" & fso.GetAbsolutePathName(arg) & "'")
            errcode = err.number
        else
            call files.Add(file)
        end if
    on error goto 0
    i = i + 1
loop


' ================================
' output stdin to stdout and files
' ================================
dim stdin, line
set stdin = WScript.Stdin
do while not stdin.AtEndOfStream
    line = stdin.ReadLine()
    call WScript.Echo(line)
    for each file in files
        call file.WriteLine(line)
    next
loop

call WScript.Quit(errcode)
