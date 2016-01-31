' [Usage]
' ���O
'        tail - �t�@�C���̖���������\������
' 
' ����
'        tail [OPTION]... [FILE]
' 
' ����
'        ���ꂼ��� FILE �̖��� 10 �s��W���o�͂֏o�͂���B
'        ������ FILE ���^����ꂽ�ꍇ�́A�^����ꂽ�t�@�C�������w�b�_�Ƃ��Đ�ɏo�͂���B
'        FILE ���^�����Ȃ������ꍇ�A���邢�� FILE �� - �̏ꍇ�ɂ͕W�����͂���ǂݍ��ށB
' 
'        /c K, /chars K
'               ���� K ����(���s�����܂�)���o�͂���; �e�t�@�C���� K �����ڂ���o�͂��J�n����ɂ́A����� +K ���g���B
' 
'        /f, /follow
'               �t�@�C���̓��e�����������鎞�A�ǉ����ꂽ�f�[�^���o�͂���B
' 
'        /F
'               /follow /retry �Ɠ����ł���B
' 
'        /n, /lines K
'               ���� 10 �s�̑���ɖ��� K �s���o�͂���; �e�t�@�C���� K �s�ڂ���o�͂��J�n����ɂ́A����� +K ���g���B
' 
'        /retry
'               �t�@�C�����A�N�Z�X�ł��Ȃ��A���邢�̓A�N�Z�X�ł��Ȃ��Ȃ낤�Ƃ��Ă����Ƃ��Ă��A
'               �t�@�C���̃I�[�v�����J��Ԃ�; /follow �ŒǐՂ��Ă���ꍇ�ɗL�p�ł���B
' 
'        /s, /sleep-interval N
'               -f �Ƌ��Ɏg�p����B�ǐՂ��Ă���t�@�C���̃`�F�b�N�� N �b���ɍs���B (�f�t�H���g�� 1.0 �b)
' 
'        /help ���̃w���v��\�����ďI������B
' 
'        /version
'               �o�[�W��������\�����ďI������B
' 
' ����
'       �t�@�C���L�q�q���g�����ǐՂ͂ł��Ȃ��B��Ƀt�@�C�������g�p����B
'       �I���W�i���� tail �R�}���h�ƈ���ĕ����t�@�C���𓯎��ɏ����ł��Ȃ��B

' [Version]
' tail version 0.1

option explicit

' ==========
' parameters
' ==========
dim line_mode, n, retry, follow, interval
line_mode = true
n = "10"
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
    case "/F"
        follow = true
        retry = true
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

' ===============
' parse arguments
' ===============
dim path
if i < WScript.Arguments.Count then
    path = WScript.Arguments.Item(i)
    i = i + 1
end if

' ========
' output
' ========
dim fso, file, term, exists
set fso = CreateObject("Scripting.FileSystemObject")
exists = true
on error resume next
if isEmpty(path) then
    set file = WScript.StdIn
else
    set file = fso.OpenTextFile(path)
end if
if err.number <> 0 then
    call WScript.StdErr.WriteLine("tail: file not found. '" & path & "'")
    call err.clear()
    exists = false
end if
on error goto 0

if left(n, 1) = "+" then
    term = skip(file, clng(n), line_mode)
else
    term = tail(file, clng(n), line_mode)
end if

call file.Close()


' =======
' follow
' =======
dim before
before = term
do while follow
    if exists then
        if fso.FileExists(fso.GetAbsolutePathName(path)) then
            on error resume next
            set file = fso.OpenTextFile(fso.GetAbsolutePathName(path))
            if err.number <> 0 then
                call err.clear()
                if not retry then exit do
            end if
            term = skip(file, term, line_mode)
            if term < before then call WScript.StdErr.WriteLine("tail: " & path & ": file truncated.")
            call file.Close()
            on error goto 0
            exists = true
        else
            call WScript.StdErr.WriteLine("not found. '" & path & "'")
            exists = false
        end if
    else
        if fso.FileExists(fso.GetAbsolutePathName(path)) then
            on error resume next
            set file = fso.OpenTextFile(fso.GetAbsolutePathName(path))
            if err.number <> 0 then
                call err.clear()
                if not retry then exit do
            end if
            term = skip(file, term, line_mode)
            if term < before then call WScript.StdErr.WriteLine("tail: " & path & ": file truncated.")
            call file.Close()
            on error goto 0
            exists = true
        else
            exists = false
        end if
    end if
    before = term
    call WScript.Sleep(interval * 1000)
loop

' ====
' exit
' ====
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

function skip(byval stream, byval n, byval line_mode)
    dim count
    count = 0
    do while not stream.AtEndOfStream and count < n
        if line_mode then
            call stream.ReadLine()
        else
            call stream.Read(1)
        end if
        count = count + 1
    loop
    
    do while not stream.AtEndOfStream
        if line_mode then
            call WScript.Stdout.Write(stream.ReadLine() & vbCrLf)
        else
            call WScript.Stdout.Write(stream.Read(1))
        end if
        count = count + 1
    loop
    skip = count
end function

function tail(byval stream, byval n, byval line_mode)
    dim buf(), i, total
    redim buf(n - 1)
    i = 0
    total = 0
    do while not stream.AtEndOfStream
        if line_mode then
            buf(i) = stream.ReadLine() & vbCrLf
        else
            buf(i) = stream.Read(1)
        end if
        total = total + 1
        i = (i + 1) mod n
    loop
    
    dim term, count
    term = n
    if total < n then term = i : i = 0
    count = 0
    do while count < term
        call WScript.StdOut.Write(buf(i))
        count = count + 1
        i = (i + 1) mod n
    loop
    tail = total
end function
