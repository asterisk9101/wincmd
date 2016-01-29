' ���O
'     wc - �t�@�C���̕������E�P�ꐔ�E�s����\������
' 
' ����
'     wc [/c] [/l] [/w] [/L] [/chars] [/lines] [/max-line-length] [/words] [FILE]...
'     wc [/?] [/help] [/v] [/version]
' 
' ����
'     wc �͎w�肳�ꂽ�e FILE �̕������E�󔒂ŋ�؂�ꂽ�P��̐��E�s���𐔂���B 
'     FILE ������^�����Ȃ��ƕW�����͂���ǂݍ��ށB
'     �܂� FILE �� �e-�f �������ꍇ�ɂ́A���̃t�@�C���ɂ͕W�����͂��p������B
' 
'     �f�t�H���g�ł́A wc �� 3 �S�Ă��o�͂���B
'     �I�v�V�����w��ɂ��o�͂��鍀�ڂ��w��ł���B
'     �I�v�V�����͐�Ɏw�肵�����̂����������Ƃ͂ł��Ȃ��B
'     ���������� �ewc /chars /words�f �͕������ƒP�ꐔ�̗������o�͂���B
' 
'     wc �͍Ō�̍s�Ɋe FILE �̃J�E���g�������v���ĕ\������B
'     ���ʂ́A���s���E�P�ꐔ�E�������̏��ɕ\�������B
' 
' �I�v�V����
'     /l, /lines
'         ���s���������o�͂���B
' 
'     /c, /chars
'         �������������o�͂���B
' 
'     /w, /words
'         �P�ꐔ�������o�͂���B
' 
'     /L, /max-line-length
'         �t�@�C�����̍s�̍ő咷������\������B��ȏ�̃t�@�C�����w�肳�ꂽ�ꍇ�́A
'         �����̂����ł̍ő咷��\������ (���v�ł͂Ȃ�)�B
' 
'     /help
'         �W���o�͂Ɏg�p���@�̃��b�Z�[�W���o�͂��Đ���I������B
' 
'     /version
'         �W���o�͂Ƀo�[�W���������o�͂��Đ���I������B
' 
' ����
'     �����R�[�h�� Shift-JIS �ȊO�̏ꍇ�͂��܂��J�E���g�ł��Ȃ��B
'     ���s������1�����Ƃ��ăJ�E���g����B�Ⴆ�� CrLf �� 2 �����Ƃ��ăJ�E���g����B
'     �I���W�i���� wc �R�}���h�ƈ���ăo�C�g���̓J�E���g���Ȃ��B
' ======================================================================================================================

option explicit

' =================
' option parameters
' =================
dim words, lines, chars, max_line_length
words = true
lines = true
chars = true
max_line_length = false


' ========================
' parse arguments(options)
' ========================
dim arg, i
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if Left(arg, 1) <> "/" then exit do
    
    if i = 0 then
        chars = false
        words = false
        lines = false
    end if
    
    select case arg
    case "/l", "/lines" lines = true
    case "/c", "/chars" chars = true
    case "/w", "/words" words = true
    case "/L", "/max-line-length" max_line_length = true
    case "/?", "/help"
        call WScript.Echo("USAGE: wc [OPTION]... [FILE]...")
        call WScript.Echo("�t�@�C���̕������E�P�ꐔ�E�s����\������")
        call WScript.Quit(0)
    case "/v", "/version"
        call WScript.Echo("wc version 0.1")
        call WScript.Quit(0)
    case else
        call WScript.StdErr.WriteLine("���m�̃I�v�V���� '" & arg & "' ���w�肳��܂����B")
        call WScript.Quit(1)
    end select
    i = i + 1
loop


' =======================
' parse arguments(inputs)
' =======================
dim fso, files, file
set fso = CreateObject("Scripting.FileSystemObject")
set files = CreateObject("Scripting.Dictionary")
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if arg = "-" then
        call files.Add(arg, WScript.Stdin)
    else
        on error resume next
        set file = fso.OpenTextFile(arg)
        if err.number <> 0 then
            call WScript.StdErr.WriteLine( _
                "[" & Err.Number & "]" & Err.description & _
                "'" & fso.GetAbsolutePathName(arg) & "'")
        else
            call files.Add(arg, file)
        end if
        on error goto 0
    end if
    i = i + 1
loop
if files.Count = 0 then call files.Add("-", WScript.Stdin)


' =============================================
' count chars, words, lines and max-line-length
' =============================================
dim results, result
set results = CreateObject("Scripting.Dictionary")
for each file in files
    set result = count(files.Item(file))
    call results.Add(file, result)
next


' =============================
' output results and calc total
' =============================
dim total
set total = new resultset
for each file in results
    set result = results.Item(file)
    total.add_chars(result.chars)
    total.add_words(result.words)
    total.add_lines(result.lines)
    total.add_max_line_length(result.max_line_length)
    if chars then call WScript.Stdout.Write(result.chars & Chr(9))
    if words then call WScript.Stdout.Write(result.words & Chr(9))
    if lines then call WScript.Stdout.Write(result.lines & Chr(9))
    if max_line_length then call WScript.Stdout.Write(result.max_line_length & Chr(9))
    if files.Count > 1 then WScript.Echo(file)
next


' ============
' output total
' ============
if files.Count > 1 then
    if chars then call WScript.Stdout.Write(total.chars & Chr(9))
    if words then call WScript.Stdout.Write(total.words & Chr(9))
    if lines then call WScript.Stdout.Write(total.lines & Chr(9))
    if max_line_length then call WScript.Stdout.Write(total.max_line_length & Chr(9))
    WScript.Echo("total")
end if


' =========================
' define class and function
' =========================
class resultset
    public chars
    public words
    public lines
    public max_line_length
    private sub Class_Initialize
        chars = 0
        words = 0
        lines = 0
        max_line_length = 0
    end sub
    public function init(byval c, byval w, byval l, byval m)
        chars = c
        words = w
        lines = l
        max_line_length = m
        set init = me
    end function
    public function add_chars(byval num)
        chars = chars + num
    end function
    public function add_words(byval num)
        words = words + num
    end function
    public function add_lines(byval num)
        lines = lines + num
    end function
    public function add_max_line_length(byval num)
        max_line_length = max_line_length + num
    end function
end class

function count(byval stream)
    dim result
    set result = new resultset
    call result.init(0, 0, 0, 0)
    
    dim ch, before, width
    before = " "
    width = 0
    do while not stream.AtEndOfStream
        ch = stream.Read(1)
        width = width + 1
        
        ' count chars
        call result.add_chars(1)
        
        ' count words
        if Asc(before) <= 32 and (Asc(ch) < 0 or 32 < Asc(ch)) then
            call result.add_words(1)
        end if
        
        ' count lines, and line-length
        if before = vbLf then
            call result.add_lines(1)
            if result.max_line_length < width then result.max_line_length = width
            width = 0
        elseif before = vbCr and ch <> vbLf then
            call result.add_lines(1)
            if result.max_line_length < width then result.max_line_length = width
            width = 0
        end if
        before = ch
    loop
    
    if width > result.max_line_length then result.max_line_length = width
    if result.chars > 0 then call result.add_lines(1)
    
    set count = result
end function
