// [Usage]
// 名前
//     tr - 文字の変換・削除や、連続する文字の圧縮を行う  
// 
// 書式
//     tr [/c] [/complement] [/d] [/delete] [/s] [/squeeze-repeats] SET1 [SET2]
//     tr [/?] [/help] [/v] [/version]
// 
// 説明
//     tr は、標準入力から読み込んだ文字を置換、切り詰め、削除し、標準出力に書き込みます。
// 
// オプション
//     /c, /complement
//         SET1 の(ascii文字の)補集合を使用する。
// 
//     /d, /delete
//         SET1 中の文字を削除する。置換は行わない。
// 
//     /s, /squeeze-repeats
//         入力の中に SET1 に含まれる文字が連続して存在する場合に 1 個に置換する。
// 
//     /?, /help
//         標準出力に使用方法のメッセージを出力して正常終了する。
// 
//     /version
//         標準出力にバージョン情報を出力して正常終了する。
// 
// SET1,SET2 の指定
//     \NNN 文字の 8 進数表現(1から3個の8進数)
// 
//     \\   バックスラッシュ
// 
//     \a   ベル
// 
//     \b   バックスペース
// 
//     \f   フォームフィード
// 
//     \n   改行
// 
//     \r   復帰
// 
//     \t   水平タブ
// 
//     \v   垂直タブ
// 
//     CHAR1-CHAR2
//          CHAR1 から CHAR2 までを昇順に展開した文字列
// 
//     [:alnum:]
//          全てのアルファベットと数字
// 
//     [:alpha:]
//          全てのアルファベット
// 
//     [:blank:]
//          スペースと水平タブ
// 
//     [:cntrl:]
//          全ての制御文字
// 
//     [:digit:]
//          全ての数字
// 
//     [:graph:]
//          全ての表示可能文字（空白を含まない）。
// 
//     [:lower:] 
//          全ての小文字アルファベット。
// 
//     [:print:]
//          全ての表示可能文字（空白を含む）。
// 
//     [:punct:]
//          全ての句読点（記号）。
// 
//     [:space:]
//          全ての水平タブと垂直タブ文字。
// 
//     [:upper:]
//          全ての大文字アルファベット。
// 
//     [:xdigit:]
//          全ての16進数数値
// 
// 一般的な tr との差異
//     SET1 と SET2 の長さに差異がある場合でもエラーを出力しません。
//     従って truncate オプションはありません。
// 
//     [CHAR*] 記法は非対応です。
// 
//     [=CHAR=] 記法は非対応です。
// 
//     文字クラスの使用に制限はありません。SET2 でも全て使用できます。
// 

// [Version]
// tr.vbs version 0.1

var prog_name = "tr";

function error(m) {
    WScript.StdErr.WriteLine(m);
    WScript.Quit(1);
};
function view(label) {
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var file = fso.OpenTextFile(WScript.ScriptFullName);
    var line;
    
    while(!file.AtEndOfStream) {
        line = file.ReadLine();
        if (line.indexOf("// [" + label + "]") === 0) {
            while(!file.AtEndOfStream) {
                line = file.ReadLine();
                if (line.indexOf("//") === -1) { break; }
                WScript.StdOut.WriteLine(line.slice(3));
            }
            break;
        }
    }
}
function get_next_arg(index) {
    if (index < WScript.Arguments.length) {
        return WScript.Arguments(index);
    } else {
        WScript.StdErr.WriteLine(prog_name + ": arguments error");
        WScript.Quit(1);
    }
}
function echo(m) {
    WScript.Echo(m);
}
function tr(opts, SET1, SET2){
    function parse_set(SET) {
        function oct() {
            var u888 = 0, i, oct;
            for (i = 0; i < 3; i++) {
                oct = parseInt(ch, 16);
                if (!isFinite(oct)) { break; }
                u888 = (u888 * 8) + oct;
                next();
            }
            return String.fromCharCode(u888);
        }
        function escape() {
            switch(next()){
            case "a": return "\a";
            case "b": return "\b";
            case "f": return "\f";
            case "r": return "\r";
            case "n": return "\n";
            case "t": return "\t";
            case "v": return "\v";
            case "\\": return "\\";
            default:
                if (isFinite(ch)) {
                    return oct();
                } else {
                    throw new Error();
                }
            }
        }
        function alnumClass() {
            return "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
        };
        function alphaClass() {
            return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
        }
        function blankClass() {
            return [" ", "\t"];
        }
        function cntrlClass() {
            var buf = [], i;
            for(i = 0; i < 33; i++) {
                buf.push(String.fromCharCode(i));
            }
            return buf;
        }
        function digitClass() {
            return "0123456789".split("");
        }
        function graphClass() {
            var buf = [], i;
            for(i = 33; i < 127; i++){
                buf.push(String.fromCharCode(i));
            }
            return buf;
        }
        function lowerClass() {
            return "abcdefghijklmnopqrstuvwxyz".split("");
        }
        function printClass() {
            var buf = [], i;
            for(i = 32; i < 127; i++){
                buf.push(String.fromCharCode(i));
            }
            return buf;
        }
        function punctClass() {
            return "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~".split("");
        }
        function spaceClass() {
            return " \t".split("");
        }
        function upperClass() {
            return " \t\n\x0B\f\r".split("");
        }
        function xdigitClass() {
            return "0123456789abcdefABCDEF".split("");
        }
        function charClass() {
            var buf = [];
            while(true){
                if (ch === "") { return buf; }
                if (ch === ":") {
                    next();
                    if (ch === "]") { break; }
                    buf.push(":");
                    buf.push(ch);
                } else {
                    buf.push(ch);
                }
                next();
            }
            switch(buf.join("")){
            case "alnum": return alnumClass();
            case "alpha": return alphaClass();
            case "blank": return blankClass();
            case "cntrl": return cntrlClass();
            case "digit": return digitClass();
            case "graph": return graphClass();
            case "lower": return lowerClass();
            case "print": return printClass();
            case "punct": return punctClass();
            case "space": return spaceClass();
            case "upper": return upperClass();
            case "xdigit": return xdigitClass();
            default: throw new Error("invalid character class. '" + buf.join("") + "'");
            }
        }
        function range(start) {
            var list = [];
            var start_code = start.charCodeAt(start);
            var end_code = next().charCodeAt(0);
            if (start_code > end_code) { throw new Error(); }
            var i = start_code;
            for (; i <= end_code; i++) {
                list.push(String.fromCharCode(i));
            }
            return list;
        }
        function next() {
            at++;
            ch = SET.charAt(at);
            return ch;
        }
        var at, ch, list;
        at = 0;
        ch = SET.charAt(at);
        list = [];
        while(ch !== "") {
            switch(ch){
            case "[":
                next();
                if (ch === ":") {
                    next();
                    list = list.concat(charClass());
                } else {
                    list.push("[");
                    list.push(ch);
                }
                break;
            case "-":
                list = list.concat(range(list.pop()));
                break;
            case "\\":
                list.push(escape());
                break;
            default:
                list.push(ch);
                break;
            }
            next();
        }
        return list;
    }
    function complement(set_list) {
        var buf = [], i, j, len, hit;
        len = set_list.length;
        for(i = 0; i < 128; i++) {
            ch = String.fromCharCode(i);
            hit = false;
            for(j = 0; j < len; j++) {
                if (set_list[j] === ch) {
                    hit = true; break;
                }
            }
            if (!hit) { buf.push(ch); }
        }
        return buf;
    }
    var i, len1, len2, ch, index, tail, before;
    var set1 = parse_set(SET1);
    var set2 = parse_set(SET2 || "");
    tail = set2[set2.length - 1];
    
    if (opts.complement) {
        set1 = complement(set1);
    }
    len1 = set1.length;
    len2 = set2.length;
    while(!WScript.StdIn.AtEndOfStream) {
        ch = WScript.StdIn.Read(1);
        index = -1;
        for(i = 0; i < len1; i++) {
            if (ch === set1[i]) { index = i; }
        }
        if (opts.del && index !== -1) { continue; }
        if (opts.squeeze && index !== -1 && before === ch) { continue; }
        before = ch;
        if (index > len2) { WScript.StdOut.Write(tail); continue; }
        if (index === -1) { WScript.StdOut.Write(ch); continue; }
        if (-1 < index && index < len2) { WScript.StdOut.Write(set2[index]); continue; }
        WScript.StdOut.Write(ch);
    }
}

// parse options
var arg, i, len, opts = {}, SET1, SET2;
for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg === "//") { break; }
    if (arg === "--") { break; }
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
    case "/dc":
    case "/cd":
        opts.complement = true;
        opts.del = true;
        break;
    case "/c":
    case "/complement":
        opts.complement = true;
        break;
    case "/d":
    case "/delete":
        opts.del = true;
        break;
    case "/s":
    case "/squeeze-repeats":
        opts.squeeze = true;
        break;
    case "/?":
    case "/help":
        view("Usage");
        WScript.Quit(0);
    case "/v":
    case "/version":
        view("Version");
        WScript.Quit(0);
    default:
        error(prog_name + ": invalid arguments. '" + arg + "'")
        break;
    }
}

// parse arguments
if (i < len) {
    SET1 = WScript.Arguments(i);
} else {
    throw new Error(prog_name + ": missing argument. 'SET1'");
}
if (!opts.del) {
    i++;
    SET2 = get_next_arg(i);
}

tr(opts, SET1, SET2);
