' [Usage]
' ���O
'     cut - �t�@�C���̊e�s���當�߂��Ƃ�̂���
' 
' ����
'     cut [/f FIELD-LIST | /c CHARACTER-LIST] [/d DELIMITER] [/o OUTPUT-DELIMITER] [/s] [/v] [FILE...]
'     cut [/?] [/help] [/version]
' 
' ����
'     cut �́A�^����ꂽ FILE ���ꂼ�ꂩ��A�e�s�̈ꕔ��I�����ĕW���o�͂ɏ����o���B 
'     FILE ������^�����Ȃ��ƕW�����͂���ǂݍ��ށB�܂� FILE �� `-' �������ꍇ�ɂ́A
'     ���̃t�@�C���ɂ͕W�����͂��p������B
' 
'     CHARACTER-LIST, FIELD-LIST �ɂ́A��ȏ�̐��l���͈� (�_�b�V���Őڑ����ꂽ2�̐��l) ��
'     �R���}�ŋ�؂��Ďw�肷��B�o�C�g�E�����E�t�B�[���h�̔ԍ��� 1 ����U����B
' 
' �I�v�V����
'     /c CHARACTER-LIST, /characters CHARACTER-LIST
'         CHARACTER-LIST �Ƀ��X�g���ꂽ�ʒu�̊e����������\������B
'         �^�u��o�b�N�X�y�[�X���ق��̕��ʂ̕����Ɠ����悤��1�����Ƃ��Ĉ����B
' 
'     /f FIELD-LIST, /fields FIELD-LIST
'         FIELD-LIST �Ƀ��X�g���ꂽ�ʒu�̃t�B�[���h�����\������B
'         �t�B�[���h�̋�؂�̓f�t�H���g�ł� <TAB> �ł���B
' 
'     /d DELIM, /delimiter DELIM
'         ��؂蕶�� DELIM ���w�肷��B�f�t�H���g�� <TAB> �B
'         DELIM �Ɏw��ł��镶���� 1 ���������B
'         /f �ƍ��킹�Ďg�p����B/c �Ɠ����Ɏw�肵���ꍇ�͖��������B
' 
'     /s, /silent
'         ��؂蕶�����o�͂��Ȃ��B
'         /f �ƍ��킹�Ďg�p����B/c �Ɠ����Ɏw�肵���ꍇ�͖��������B
' 
'     /o OUT-DELIM, /output-delimiter OUT-DELIM
'         �o�͂����؂蕶�� OUT-DELIM ���w�肷��B
'         �w�肵�Ȃ������ꍇ /d �Ɠ����������g�p�����B
' 
'     /v, /complement
'         �\���E��\���𔽓]����B
' 
'     /?, /help
'         �W���o�͂Ɏg�p���@�̃��b�Z�[�W���o�͂��Đ���I������B
' 
'     /version
'         �W���o�͂Ƀo�[�W���������o�͂��Đ���I������B
' 
' �I���W�i���� cut �Ƃ̍���
'     �s���S�Ȕ͈͎w��(ex. -N, M-)�͂ł��Ȃ��B
'     �d�������t�B�[���h�̎w��(ex. /f 1,1,2)���ł���B
'     �t�B�[���h�̓���ւ�(ex. /f 2,1)���ł���B

' [Version]
' cut.vbs version 0.1

option explicit

' ================
' define functions
' ================
function abort(byval m)
    ' ���b�Z�[�W m ���G���[�o�͂��Ĉُ�I������B
    call WScript.StdErr.WriteLine(m)
    call WScript.Quit(1)
end function

function view(byval label)
    ' ���x�� label ����n�܂�A�������R�����g��\������B
    ' �g�����Ȃǂ�\�����邽�߂Ɏg�p����B
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

function get_next_arg(byval param, byref i)
    ' ���̈�����Ԃ��B���̈�����������Έُ�I��������B
    ' ���� i �́A�Ăяo�����̒l��ύX����B
    if i < WScript.Arguments.Count - 1 then
        i = i + 1
    else
        call abort("cut: arguments shortage. '" & param & "'")
    end if
    get_next_arg = WScript.Arguments.Item(i)
end function

function toColNumber(byval n)
    ' ���� n �𐔒l�ɕϊ�����B�ϊ��ł��Ȃ���Έُ�I��������B
    if not isNumeric(n) then
        call abort("cut: invalid field name. '" & n & "'")
    end if
    toColNumber = clng(n)
end function

function parseRange(byval range)
    ' ���� range �ŗ^����ꂽ�͈͂�\���������ϊ�����B
    ' �Ⴆ�� "1-3" ���^����ꂽ�Ƃ��A"1,2,3" ��Ԃ��B
    dim r
    r = split(range, "-")
    
    dim n
    select case ubound(r)
    case 0
        parseRange = r(0)
    case 1
        if not isNumeric(r(0)) or not isNumeric(r(1)) then
            call abort("cut: invalid range name. '" & r(0) & "-" & r(1) & "'")
        end if
        parseRange = r(0)
        for n = r(0) + 1 to r(1)
            parseRange = parseRange & "," & n
        next
    case else
        call abort("cut: invalid range range. '" & range & "'")
    end select
end function

function map(byval ary, byval func)
    ' ���� ary �Ŏ󂯎�����z��̊e�v�f���A
    ' ���� func �Ŏ󂯎�����֐��̑������ɓn���A
    ' ���̕Ԃ�l�ŐV�����z�������ĕԂ��B
    dim i
    i = 0
    do while i <= ubound(ary)
        ary(i) = func(ary(i))
        i = i + 1
    loop
    map = ary
end function

function indexOf(byval ary, byval item)
    ' ���� ary �Ŏ󂯎�����z����������A
    ' item �̂���ʒu��Ԃ��Bitem ���z��ɑ��݂��Ȃ���� -1 ��Ԃ��B
    dim ret, i
    ret = -1
    i = 0
    do while i <= ubound(ary)
        if ary(i) = item then
            ret = i
            exit do
        end if
        i = i + 1
    loop
    indexOf = ret
end function

function uniq(byval list)
    dim newlist
    set newlist = CreateObject("System.Collections.ArrayList")
    
    if list.Count = 0 then
        set uniq = newlist
        exit function
    end if
    
    dim i
    i = 0
    set newlist = list.item(i)
    do while i < list.Count()
        if newlist.item(newlist.Count() - 1) <> list.item(i) then
            call newlist.Add(list.item(i))
        end if
        i = i + 1
    loop
    
    set uniq = newlist
end function

function toArrayList(byval ary)
    dim item, list
    set list = CreateObject("System.Collections.ArrayList")
    for each item in ary
        call list.Add(item)
    next
    set toArrayList = list
end function

function cut_delim(byval file, byval fields, byval complement, byval delim, byval silent, byval outdelim)
    ' �t�B�[���h��؂�o��
    dim columns, index, line
    if complement then
        do while not file.AtEndOfStream
            set line = CreateObject("System.Collections.ArrayList")
            columns = split(file.ReadLine(), delim)
            index = 0
            do while index <= ubound(columns)
                if indexOf(fields, index + 1) = -1 then
                    call line.Add(columns(index))
                end if
                index = index + 1
            loop
            
            if silent then
                call WScript.StdOut.WriteLine(join(line.ToArray()))
            else
                call WScript.StdOut.WriteLine(join(line.ToArray(), outdelim))
            end if
        loop
    else
        do while not file.AtEndOfStream
            set line = CreateObject("System.Collections.ArrayList")
            columns = split(file.ReadLine(), delim)
            index = 0
            do while index <= ubound(fields)
                if 0 <= fields(index) - 1 and fields(index) - 1 <= ubound(columns) then
                    call line.Add(columns(fields(index) - 1))
                end if
                index = index + 1
            loop
            
            if silent then
                call WScript.StdOut.WriteLine(join(line.ToArray()))
            else
                call WScript.StdOut.WriteLine(join(line.ToArray(), outdelim))
            end if
        loop
    end if
end function

function cut_chars(byval file, byval ranges, byval complement, byval outdelim)
    ' ������؂�o��
    if complement then
        call cut_chars_cmplement(file, ranges, outdelim)
    else
        call cut_chars_select(file, ranges, outdelim)
    end if
end function

function fill(byval ary, byval val)
    dim i
    i = 0
    do while i <= ubound(ary)
        ary(i) = val
        i = i + 1
    loop
    fill = ary
end function

function DelPosList(byval length, byval ranges)
    dim list, index
    list = Array(length) - 1
    
    ' list �� true �ŏ���������B
    list = fill(list, true)
    
    ' ranges ��W�J����
    ranges = join(map(split(ranges, ","), GetRef("parseRange")), ",")
    
    ' ranges �Ŏw�肳�ꂽ list �̈ʒu�� false �ɂ���
    for each index in split(ranges, ",")
        list(index) = false
    next
    
    DelPosList = list
end function

function StringToArray(byval str)
    dim list, i
    set list = CreateObject("System.Collections.ArrayList")
    i = 1
    do while i <= len(str)
        call list.Add(mid(str, i, 1))
        i = i + 1
    loop
    StringToArray = list.ToArray()
end function

function ApplyDeletePositions(byval list, byval del_positions)
    dim i, pos
    
    ' del_position �̗v�f���폜����
    i = 0
    do while i <= ubound(del_positions)
        pos = del_positions(i) - 1
        if -1 < pos and pos < list.Count then
            call list.RemoveAt(pos)
            call list.Insert(pos, null)
        end if
        i = i + 1
    loop
    
    set ApplyDeletePositions = list
end function

function ArrayToList(byval ary)
    dim list, item
    set list = CreateObject("System.Collections.ArrayList")
    for each item in ary
        call list.Add(item)
    next
    set ArrayToList = list
end function

function uniq(byval list)
    dim newlist, i, item
    set newlist = CreateObject("System.Collections.ArrayList")
    
    if list.Count = 0 then set uniq = newlist: exit function
    
    i = 0
    call newlist.Add(list.Item(i))
    for each item in list
        if newlist.Item(newlist.Count - 1) <> item then
            call newlist.Add(item)
        end if
    next
    
    set uniq = newlist
end function

function DelPositions(byval ranges)
    dim list
    
    ranges = join(map(ranges, GetRef("parseRange")), ",")
    
    set list = ArrayToList(split(ranges, ","))
    call list.Sort()
    set list = uniq(list)
    
    DelPositions = list.ToArray()
end function

function CompressNull(byval list)
    dim i, val, next_val, newlist
    set newlist = CreateObject("System.Collections.ArrayList")
    
    set CompressNull = newlist
    if list.Count = 0 then exit function
    call newlist.Add(list.Item(0))
    if list.Count = 1 then exit function
    
    val = list.Item(0)
    i = 1
    do while i < list.Count
        next_val = list.Item(i)
        if not isNull(val) or not isNull(next_val) then
            call newlist.Add(next_val)
        end if
        val = next_val
        i = i + 1
    loop
    
    set CompressNull = newlist
end function

function TrimNull(byval list)
    dim newlist, item
    set newlist = CreateObject("System.Collections.ArrayList")
    
    for each item in list
        call newlist.Add(item)
    next
    
    if newlist.Count = 0 then
        ' nanimosinai
    elseif list.Count = 1 then
        if isNull(newlist.Item(0)) then call newlist.RemoveAt(0)
    else
        if isNull(newlist.Item(0)) then call newlist.RemoveAt(0)
        if isNull(newlist.Item(newlist.Count - 1)) then
            call newlist.RemoveAt(newlist.Count - 1)
        end if
    end if
    
    set TrimNull = newlist
end function

function InsertDelimiter(byval list, byval outdelim)
    dim newlist, item
    set newlist = CreateObject("System.Collections.ArrayList")
    for each item in list
        call newlist.Add(item)
    next
    i = 0
    do while i < newlist.Count
        if isNull(newlist.Item(i)) then
            newlist.Item(i) = outdelim
        end if
        i = i + 1
    loop
    
    set InsertDelimiter = newlist
end function

function cut_chars_cmplement(byval file, byval ranges, byval outdelim)
    dim line, del_positions, list
    
    ' �폜����ʒu�����߂�
    del_positions = DelPositions(ranges)
    
    do while not file.AtEndOfStream
        line = file.ReadLine()
        
        ' ������𕶎����X�g�ɕϊ�����
        set list = ArrayToList(StringToArray(line))
        
        ' �������X�g�ɍ폜�ʒu��K�p(null)����
        set list = ApplyDeletePositions(list, del_positions)
        
        ' �A������ Null �����k����
        set list = CompressNull(list)
        
        ' ���[�� Null ���폜����
        set list = TrimNull(list)
        
        ' Null �� outdelim �ɒu������
        set list = InsertDelimiter(list, outdelim)
        
        call WScript.StdOut.WriteLine(join(list.ToArray(), ""))
    loop
end function

function SelectRanges(byval list, byval sel_positions)
    dim cols, range, pos, col
    set cols = CreateObject("System.Collections.ArrayList")
    for each range in sel_positions
        set col = CreateObject("System.Text.StringBuilder")
        for each pos in split(range, ",")
            pos = clng(pos) - 1
            if -1 < pos and pos < list.Count then
                call col.Append_3(list.Item(pos))
            end if
        next
        call cols.Add(col.ToString())
    next
    set SelectRanges = cols
end function

function cut_chars_select(byval file, byval ranges, byval outdelim)
    dim line, sel_positions, list
    sel_positions = map(ranges, GetRef("parseRange"))
    
    do while not file.AtEndOfStream
        line = file.ReadLine()
        set list = ArrayToList(StringToArray(line))
        set list = SelectRanges(list, sel_positions)
        call WScript.StdOut.WriteLine(join(list.ToArray(), outdelim))
    loop
end function


' ================
' global variables
' ================
dim exit_code
exit_code = 0


' ==========
' parameters
' ==========
dim char_mode, delim, fields, complement, silent, outdelim
char_mode = false
fields = null
complement = false
delim = vbTab
silent = false
outdelim = delim


' =============
' parse options
' =============
dim arg, i
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if left(arg, 1) <> "/" then exit do
    select case arg
    case "/c", "/characters"
        char_mode = true
        fields = split(get_next_arg(arg, i), ",")
        outdelim = ""
    case "/d", "/delimiter"
        delim = get_next_arg(arg, i)
        outdelim = delim
        if len(delim) > 1 then
            call abort("cut: delimiter is 1cahr. '" & delim & "'")
        end if
    case "/f", "/fields"
        char_mode = false
        fields = split(get_next_arg(arg, i), ",")
        fields = map(fields, GetRef("parseRange"))  ' "1-3" -> "1,2,3"
        fields = split(join(fields, ","), ",")      ' "1,2", "3,4" -> "1,2,3,4" -> "1", "2", "3", "4"
        fields = map(fields, GetRef("toColNumber")) ' "1", "2", "3" -> 1, 2, 3
    case "/v", "/complement"
        complement = true
    case "/s", "/silent"
        silent = true
    case "/o", "/output-delimiter"
        outdelim = get_next_arg(arg, i)
    case "/?", "/help"
        call view("Usage")
        call WScript.Quit(0)
    case "/version"
        call view("Version")
        call WScript.Quit(0)
    case else
        call abort("cut: invalid arguments. '" & arg & "'")
    end select
    i = i + 1
loop

if not isArray(fields) then call abort("cut: require fields specify.")


' ===============
' parse arguments
' ===============
dim fso, inputs, file
set fso = CreateObject("Scripting.FileSystemObject")
set inputs = CreateObject("System.Collections.ArrayList")
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if arg = "-" then
        call inputs.Add("-")
    elseif fso.FileExists(fso.GetAbsolutePathName(arg)) then
        call inputs.Add(arg)
    else
        call WScript.StdErr.WriteLine("cut: not found '" & arg & "'")
        exit_code = 1
    end if
    i = i + 1
loop 

if inputs.Count = 0 then call inputs.Add("-")


' ====
' main
' ====
dim input, line
for each input in inputs
    if input = "-" then
        set file = WScript.StdIn
    else
        on error resume next
        set file = fso.OpenTextFile(fso.GetAbsolutePathName(input))
        on error goto 0
    end if
    
    if err.number <> 0 then
        call WScript.StdErr.WriteLine("cut: file open failed. '" & input & "'")
        call err.clear()
    else
        if char_mode then
            call cut_chars(file, fields, complement, outdelim)
        else
            call cut_delim(file, fields, complement, delim, silent, outdelim)
        end if
        call file.Close()
    end if
next
