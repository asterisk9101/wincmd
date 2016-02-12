' [Usage]
' ���O
'     mkdate - ���t��\��������𐶐�����B
' 
' ����
'     mkdate [/date yyyymmdd] [/time hhmmss] [/locale LOCALE] [FORMAT]
'     mkdate [/?] [/help] [/v] [/version]
' 
' ����
'     mkdate �̓I�v�V�����ŗ^����ꂽ���t�� FORMAT �̒ʂ�ɐ��`���ďo�͂���B
'     �I�v�V�����y�� FORMAT ���^���炦�Ȃ��Ƃ��Amkdate �̓V�X�e���������t�H�[�}�b�g "+%F" �ŏo�͂���B
' 
' FORMAT
'     �t�H�[�}�b�g�̎w��͕K�� "+" �Ŏn�܂�B����� Linux �� date �R�}���h�̃t�H�[�}�b�g�w����@�ɕ�����B
'     �擪�� "+" �łȂ��Ƃ��Amkdate �́A���̈����𖳎�����B
' 
'     %F    �N����(1970-01-02 etc.)
'     %Y    �N(1970 etc.)
'     %y    �N�̉� 2 ��(00..90)
'     %m    ��(01..12)
'     %b    ��(Jan..Dec)
'     %B    ��(January..December)
'     %d    ��(01..31)
'     %T    ����(HH:MM:SS)
'     %H    ��(00..23)
'     %I    ��(01..12)
'     %k    ��(0..23)
'     %l    ��(1..12)
'     %p    ��(AM, PM)
'     %M    ��(00..59)
'     %S    �b(00..60)
'     %n    ���s
'     %t    �����^�u
'
' ��
'     mkdate
'     => 2016-02-03 (�������w�肵�Ȃ��ꍇ�̓V�X�e���������o�͂����)
' 
'     mkdate /date 20160831 "+%F %H:%M"
'     => 2016-08-31 00:00 (�N�������w�肷��Ǝ����͏����������)
' 
'     mkdate /time 123456 "+%Y/%m/%d %T"
'     => 2016/02/03 12:34:56 (�������w�肵�Ă��N�����͏���������Ȃ�)
' 
'     mkdate /date 20160831 /time 123456 /locale "ja_JP" "+%B %H�̍�"
'     => �t�� �߂̍� (�N�����Ǝ����ƃ��P�[���𓯎��Ɏw�肷��)

' [Version]
' mkdate version 0.1

option explicit

dim date_time, date_output, format, locale
date_time = now
date_output = date_time
format = "+%F"
locale = "en_US"

dim sysdate, yyyymmdd, hhmmss
sysdate = true
dim i, arg
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if left(arg, 1) <> "/" then exit do
    select case arg
    case "/d", "/date"
        i = i + 1
        if not i < WScript.Arguments.Count then
            call WScript.StdErr.WriteLine("mkdate: argumet shortage: '/date'")
            call WScript.Quit(1)
        end if
        yyyymmdd = WScript.Arguments.Item(i)
        sysdate = false
    case "/t", "/time"
        i = i + 1
        if not i < WScript.Arguments.Count then
            call WScript.StdErr.WriteLine("mkdate: argumet shortage: '/time'")
            call WScript.Quit(1)
        end if
        hhmmss = WScript.Arguments.Item(i)
        sysdate = false
    case "/l", "/locale"
        i = i + 1
        if not i < WScript.Arguments.Count then
            call WScript.StdErr.WriteLine("mkdate: argument shortage: '/locale'")
            call WScript.Quit(1)
        end if
        locale = WScript.Arguments.Item(i)
    case "/year"
    case "/month"
    case "/day"
    case "/hour"
    case "/minute"
    case "/second"
    case "/?", "/help"
        call view("Usage")
        call WScript.Quit(0)
    case "/v", "/version"
        call view("Version")
        call WScript.Quit(0)
    case else
        call WScript.StdErr.WriteLine("mkdate: invalid argument: '" & arg & "'")
        call WScript.Quit(1)
    end select
    i = i + 1
loop


if not sysdate then
    if not isEmpty(yyyymmdd) then
        if len(yyyymmdd) <> 8 then
            call WScript.StdErr.WriteLine("mkdate: invalid argument: '" & yyyymmdd & "'")
            call WScript.Quit(1)
        end if
        date_time = cdate(left(yyyymmdd, 4) & "/" & mid(yyyymmdd, 5, 2) & "/" & right(yyyymmdd, 2))
    else
        date_time = dateserial(year(date_time), month(date_time), day(date_time))
    end if
    
    if not isEmpty(hhmmss) then
        if len(hhmmss) <> 6 then
            call WScript.StdErr.WriteLine("mkdate: invalid argument: '" & hhmmss & "'")
            call WScript.Quit(1)
        end if
        date_time = date_time + cdate(left(hhmmss, 2) & ":" & mid(hhmmss, 3, 2) & ":" & right(hhmmss, 2))
    end if
end if




if i < WScript.Arguments.Count then
    format = WScript.Arguments.Item(i)
end if


dim df
set df = (new DateFormat).init(format, locale)
date_output = df.processing(date_time)

call WScript.StdOut.WriteLine(date_output)




class DateFormat
    private at
    private ch
    private format
    private locale
    
    public function init(byval f, byval loc)
        format = f
        at = 1
        ch = mid(format, at, 1)
        locale = loc
        set init = me
    end function
    
    public function processing(byval date_time)
        
        if ch <> "+" then
            call WScript.StdErr.WriteLine("mkdate: invalid date: '" & format & "'")
            call WScript.Quit(1)
        end if
        
        dim sb
        set sb = CreateObject("System.Text.StringBuilder")
        call nextChar()
        do while ch <> ""
            if ch = "%" then
                select case nextChar
                case "F" call sb.Append_3(defaultFormat(date_time))
                case "Y" call sb.Append_3(year(date_time))
                case "y" call sb.Append_3(right(year(date_time), 2))
                case "m" call sb.Append_3(month00(date_time, true))
                case "d" call sb.Append_3(day00(date_time, true))
                case "H" call sb.Append_3(hour00(date_time, 24, true))
                case "I" call sb.Append_3(hour00(date_time, 12, true))
                case "k" call sb.Append_3(hour00(date_time, 24, false))
                case "l" call sb.Append_3(hour00(date_time, 12, false))
                case "M" call sb.Append_3(minute00(date_time, true))
                case "p" call sb.Append_3(ampm(date_time))
                case "r" call sb.Append_3(time12(date_time))
                case "S" call sb.Append_3(second00(date_time, true))
                case "T" call sb.Append_3(time24(date_time))
                case "a" call sb.Append_3(weekday00(date_time, true))
                case "A" call sb.Append_3(weekday00(date_time, false))
                case "b" call sb.Append_3(monthName00(date_time, true))
                case "B" call sb.Append_3(monthName00(date_time, false))
                case "%" call sb.Append_3("%")
                case "t" call sb.Append_3(vbTab)
                case "n" call sb.Append_3(vbCrLf)
                case else call sb.Append_3(ch)
                end select
            else
                call sb.Append_3(ch)
            end if
            call nextChar()
        loop
        processing = sb.ToString()
    end function
    
    private function nextChar()
        at = at + 1
        ch = mid(format, at, 1)
        nextChar = ch
    end function
    
    private function defaultFormat(byval date_time)
        dim ret
        ret = year(date_time)
        ret = ret & "-" & month00(date_time, true)
        ret = ret & "-" & day00(date_time, true)
        defaultFormat = ret
    end function
    
    private function month00(byval date_time, byval padding)
        dim mon
        mon = month(date_time)
        if padding then mon = right("0" & mon, 2)
        month00 = mon
    end function
    
    private function day00(byval date_time, byval padding)
        dim d
        d = day(date_time)
        if padding then d = right("0" & d, 2)
        day00 = d
    end function
    
    private function hour00(byval date_time, byval clock, byval padding)
        dim hr
        hr = hour(date_time)
        
        if clock = 12 then
            hr = hr mod 12
            if hr = 0 then hr = 12
        end if
        
        if padding then hr = right("0" & hr, 2)
        
        if clock <> 12 and locale = "ja_JP" then
            select case right("0" & hr, 2)
            case "00", "01" hr = "�q"
            case "02", "03" hr = "�N"
            case "04", "05" hr = "��"
            case "06", "07" hr = "�K"
            case "08", "09" hr = "�C"
            case "10", "11" hr = "��"
            case "12", "13" hr = "��"
            case "14", "15" hr = "��"
            case "16", "17" hr = "�\"
            case "18", "19" hr = "��"
            case "20", "21" hr = "��"
            case "22", "23" hr = "��"
            end select
        end if
        
        hour00 = hr
    end function
    
    private function minute00(byval date_time, byval padding)
        dim mi
        mi = minute(date_time)
        if padding then mi = right("0" & mi, 2)
        minute00 = mi
    end function
    
    private function second00(byval date_time, byval padding)
        dim sec
        sec = second(date_time)
        if padding then sec = right("0" & sec, 2)
        second00 = sec
    end function
    
    private function ampm(byval date_time)
        dim hr
        hr = hour(date_time)
        select case locale
        case "ja_JP"
            if hr > 12 then
                ampm = "�ߌ�"
            else
                ampm = "�ߑO"
            end if
        case else
            if hr > 11 then
                ampm = "PM"
            else
                ampm = "AM"
            end if
        end select
    end function
    
    private function time12(byval date_time)
        time12 = hour00(date_time, 12, true)
        time12 = time12 & ":" & minute00(date_time, true)
        time12 = time12 & ":" & second00(date_time, true)
        time12 = time12 & " " & ampm(date_time)
    end function
    
    private function time24(byval date_time)
        time24 = hour00(date_time, 24, true)
        time24 = time24 & ":" & minute00(date_time, true)
        time24 = time24 & ":" & second00(date_time, true)
    end function
    
    private function weekday00(byval date_time, byval abbr)
        dim wd
        wd = weekday(date_time)
        select case locale
        case "ja_JP"
            select case wd
            case 1 wd = "��"
            case 2 wd = "��"
            case 3 wd = "��"
            case 4 wd = "��"
            case 5 wd = "��"
            case 6 wd = "��"
            case 7 wd = "�y"
            end select
        case else
            select case wd
            case 1 wd = "Sunday"
            case 2 wd = "Monday"
            case 3 wd = "Thuesday"
            case 4 wd = "Wednesday"
            case 5 wd = "Thursday"
            case 6 wd = "Friday"
            case 7 wd = "Saturday"
            end select
            if abbr then wd = left(wd, 3)
        end select
        weekday00 = wd
    end function
    
    private function monthName00(byval date_time, byval abbr)
        dim mon
        mon = month(date_time)
        select case locale
        case "ja_JP"
            select case mon
            case 1 mon = "�r��"
            case 2 mon = "�@��"
            case 3 mon = "�퐶"
            case 4 mon = "�K��"
            case 5 mon = "�H��"
            case 6 mon = "������"
            case 7 mon = "����"
            case 8 mon = "�t��"
            case 9 mon = "����"
            case 10 mon = "�_����"
            case 11 mon = "����"
            case 12 mon = "�t��"
            end select
        case else
            select case mon
            case 1 mon = "January"
            case 2 mon = "February"
            case 3 mon = "March"
            case 4 mon = "April"
            case 5 mon = "May"
            case 6 mon = "June"
            case 7 mon = "July"
            case 8 mon = "August"
            case 9 mon = "September"
            case 10 mon = "October"
            case 11 mon = "November"
            case 12 mon = "December"
            end select
            if abbr then mon = left(mon, 3)
        end select
        monthName00 = mon
    end function
end class

function view(byval label)
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