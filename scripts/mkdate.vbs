option explicit

dim date_now, date_output, format, locale
date_now = now
date_output = date_now
format = "+%F"
locale = "en_US"

dim i, arg
i = 0
do while i < WScript.Arguments.Count
    arg = WScript.Arguments.Item(i)
    if left(arg, 1) <> "/" then exit do
    select case arg
    case "/?", "/help"
    case "/v", "/version"
    case else
    end select
    i = i + 1
loop


if i < WScript.Arguments.Count then
    format = WScript.Arguments.Item(i)
end if


dim df
set df = (new DateFormat).init(format, locale)
date_output = df.processing(date_now)

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
    
    public function processing(byval date_now)
        
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
                case "F" call sb.Append_3(defaultFormat(date_now))
                case "Y" call sb.Append_3(year(date_now))
                case "m" call sb.Append_3(month00(date_now, true))
                case "d" call sb.Append_3(day00(date_now, true))
                case "H" call sb.Append_3(hour00(date_now, 24, true))
                case "I" call sb.Append_3(hour00(date_now, 12, true))
                case "k" call sb.Append_3(hour00(date_now, 24, false))
                case "l" call sb.Append_3(hour00(date_now, 12, false))
                case "M" call sb.Append_3(minute00(date_now, true))
                case "n" call sb.Append_3(vbCrLf)
                case "p" call sb.Append_3(ampm(date_now, locale))
                case "r" call sb.Append_3(time12(date_now, locale))
                case "S" call sb.Append_3(second00(date_now, true))
                case "T" call sb.Append_3(time24(date_now, locale))
                case "a" call sb.Append_3(weekday00(date_now, true, locale))
                case "A" call sb.Append_3(weekday00(date_now, false, locale))
                case "b" call sb.Append_3(monthName00(date_now, true, locale))
                case "B" call sb.Append_3(monthName00(date_now, false, locale))
                case "t" call sb.Append_3(vbTab)
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
    
    private function defaultFormat(byval date_now)
        dim ret
        ret = year(date_now)
        ret = ret & "-" & month00(date_now, true)
        ret = ret & "-" & day00(date_now, true)
        defaultFormat = ret
    end function
    
    private function month00(byval date_now, byval padding)
        dim mon
        mon = month(date_now)
        if padding then mon = right("0" & mon, 2)
        month00 = mon
    end function
    
    private function day00(byval date_now, byval padding)
        dim d
        d = day(date_now)
        if padding then d = right("0" & d, 2)
        day00 = d
    end function
    
    private function hour00(byval date_now, byval clock, byval padding)
        dim hr
        hr = hour(date_now)
        if clock = 12 and hr > 12 then hr = hr - 12
        if padding then hr = right("0" & hr, 2)
        hour00 = hr
    end function
    
    private function minute00(byval date_now, byval padding)
        dim mi
        mi = minute(date_now)
        if padding then mi = right("0" & mi, 2)
        minute00 = mi
    end function
    
    private function second00(byval date_now, byval padding)
        dim sec
        sec = second(date_now)
        if padding then sec = right("0" & sec, 2)
        second00 = sec
    end function
    
    private function ampm(byval date_now, byval locale)
        dim hr
        hr = hour(date_now)
        select case locale
        case "ja_JP"
            if hr > 12 then
                ampm = "åﬂå„"
            else
                ampm = "åﬂëO"
            end if
        case else
            if hr > 11 then
                ampm = "PM"
            else
                ampm = "AM"
            end if
        end select
    end function
    
    private function time12(byval date_now, byval locale)
        time12 = hour00(date_now, 12, true)
        time12 = time12 & ":" & minute00(date_now, true)
        time12 = time12 & ":" & second00(date_now, true)
        time12 = time12 & " " & ampm(date_now, locale)
    end function
    
    private function time24(byval date_now, byval locale)
        time24 = hour00(date_now, 24, true)
        time24 = time24 & ":" & minute00(date_now, true)
        time24 = time24 & ":" & second00(date_now, true)
    end function
    
    private function weekday00(byval date_now, byval abbr, byval locale)
        dim wd
        wd = weekday(date_now)
        select case locale
        case "ja_JP"
            select case wd
            case 1 wd = "ì˙"
            case 2 wd = "åé"
            case 3 wd = "âŒ"
            case 4 wd = "êÖ"
            case 5 wd = "ñÿ"
            case 6 wd = "ã‡"
            case 7 wd = "ìy"
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
    
    private function monthName00(byval date_now, byval abbr, byval locale)
        dim mon
        mon = month(date_now)
        select case locale
        case "ja_JP"
            select case mon
            case 1 mon = "ñråé"
            case 2 mon = "î@åé"
            case 3 mon = "ñÌê∂"
            case 4 mon = "âKåé"
            case 5 mon = "éHåé"
            case 6 mon = "êÖñ≥åé"
            case 7 mon = "ï∂åé"
            case 8 mon = "ótåé"
            case 9 mon = "í∑åé"
            case 10 mon = "ê_ñ≥åé"
            case 11 mon = "ëöåé"
            case 12 mon = "étëñ"
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
