' [Usage]
' 名前
'     mkdate - 日付を表す文字列を生成する。
' 
' 書式
'     mkdate [/date yyyymmdd] [/time hhmmss] [/locale LOCALE] [FORMAT]
'     mkdate [/?] [/help] [/v] [/version]
' 
' 説明
'     mkdate はオプションで与えられた日付を FORMAT の通りに成形して出力する。
'     オプション及び FORMAT が与えらえないとき、mkdate はシステム日時をフォーマット "+%F" で出力する。
' 
' FORMAT
'     フォーマットの指定は必ず "+" で始まる。これは Linux の date コマンドのフォーマット指定方法に倣った。
'     先頭が "+" でないとき、mkdate は、その引数を無視する。
' 
'     %F    年月日(1970-01-02 etc.)
'     %Y    年(1970 etc.)
'     %y    年の下 2 桁(00..90)
'     %m    月(01..12)
'     %b    月(Jan..Dec)
'     %B    月(January..December)
'     %d    日(01..31)
'     %T    時刻(HH:MM:SS)
'     %H    時(00..23)
'     %I    時(01..12)
'     %k    時(0..23)
'     %l    時(1..12)
'     %p    時(AM, PM)
'     %M    分(00..59)
'     %S    秒(00..60)
'     %n    改行
'     %t    水平タブ
'
' 例
'     mkdate
'     => 2016-02-03 (日時を指定しない場合はシステム日時が出力される)
' 
'     mkdate /date 20160831 "+%F %H:%M"
'     => 2016-08-31 00:00 (年月日を指定すると時刻は初期化される)
' 
'     mkdate /time 123456 "+%Y/%m/%d %T"
'     => 2016/02/03 12:34:56 (時刻を指定しても年月日は初期化されない)
' 
'     mkdate /date 20160831 /time 123456 /locale "ja_JP" "+%B %Hの刻"
'     => 葉月 午の刻 (年月日と時刻とロケールを同時に指定する)

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
            case "00", "01" hr = "子"
            case "02", "03" hr = "丑"
            case "04", "05" hr = "寅"
            case "06", "07" hr = "卯"
            case "08", "09" hr = "辰"
            case "10", "11" hr = "巳"
            case "12", "13" hr = "午"
            case "14", "15" hr = "未"
            case "16", "17" hr = "申"
            case "18", "19" hr = "酉"
            case "20", "21" hr = "戌"
            case "22", "23" hr = "亥"
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
                ampm = "午後"
            else
                ampm = "午前"
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
            case 1 wd = "日"
            case 2 wd = "月"
            case 3 wd = "火"
            case 4 wd = "水"
            case 5 wd = "木"
            case 6 wd = "金"
            case 7 wd = "土"
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
            case 1 mon = "睦月"
            case 2 mon = "如月"
            case 3 mon = "弥生"
            case 4 mon = "卯月"
            case 5 mon = "皐月"
            case 6 mon = "水無月"
            case 7 mon = "文月"
            case 8 mon = "葉月"
            case 9 mon = "長月"
            case 10 mon = "神無月"
            case 11 mon = "霜月"
            case 12 mon = "師走"
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