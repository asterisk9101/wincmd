// [Usage]
// 名前
//     puts - 引数を出力する。
// 
// 文法
//     puts [/n] STRING...
//     puts [/?] [/help] [/v] [/version]
// 
// 説明
//     puts は与えられた引数に改行を付加して出力します。
//     引数が与えられなかったとき、puts は何もしません。
//     2つ以上の引数を与えられたとき、puts はそれぞれの引数を改行しながら出力します。
//     /n オプションを使用することで改行の出力を抑止することができます。
// 
// OPTION
//     /n
//         改行を出力しない。
// 
//     /?, /help
//         ヘルプを表示して終了する
// 
//     /v, /version
//         バージョン情報を出力して終了する
// 

// [Version]
// puts.js version 0.1

var prog_name = "puts";

function error(m) {
    WScript.StdErr.WriteLine(prog_name + ": " + m);
    WScript.Quit(1);
}
function view(label) {
    var fso = WScript.CreateObject("Scripting.FileSystemObject");
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
function echo(m) {
    WScript.Echo(m);
}
function get_next_arg(index) {
    if (index < WScript.Arguments.length) {
        return WScript.Arguments(index);
    } else {
        error(prog_name + ": missing argument: " + WScript.Arguments(index - 1));
    }
}
function get_opt(index, opts, strings) {
    var i, len, ch;
    var arg = WScript.Arguments(index);
    if (arg.charAt(0) !== "/") { strings.push(arg); return index; }
    arg = arg.slice(1);
    for(i = 0, len = arg.length; i < len; i++){
        ch = arg.charAt(i);
        switch(ch){
        case "l": opts.log = true; break;
        case "f": opts.full = true; break;
        case "?": view("Usage"); WScript.Quit(0);
        case "v": view("Version"); WScript.Quit(0);
        default: error("invalid argument: " + arg);;
        }
    }
    return index;
}
function parse_arguments(){
    var i, len, arg, opts = {}, strings = [];
    for(i = 0, len = WScript.Arguments.length; i < len; i++){
        arg = WScript.Arguments(i);
        if (arg === "--" || arg === "//") { i++; break; }
        switch(arg) {
        case "/log": opts.log = true; break;
        case "/n": opts.n = true; break;
        case "/help": view("Usage"); WScript.Quit(0);
        case "/version": view("Version"); WScript.Quit(0);
        default: i = get_opt(i, opts, strings); break;
        }
    }
    for(; i < len; i++){
        arg = WScript.Arguments(i);
        strings.push();
    }
    return {opts: opts, strings: strings };
}
function keta2(str) {
    return ("0" + str).slice(-2);
}

var args, opts, strings;
args = parse_arguments();
opts = args.opts;
strings = args.strings;

// exec
var i, len, str, d;
for(i = 0, len = strings.length; i < len; i++){
    str = strings[i];
    if (opts.log) {
        d = new Date();
        str = [
            d.getFullYear() + "/" + keta2(d.getMonth()) + "/" + keta2(d.getDay()) + " " + 
            keta2(d.getHours()) + ":" + keta2(d.getMinutes()) + ":" + keta2(d.getSeconds()) + "." + keta2(d.getMilliseconds()) + " " +
            str
            ].join("")
    }
    if (opts.n){
        WScript.StdOut.Write(str);
    } else {
        WScript.StdOut.WriteLine(str);
    }
}
WScript.Quit(0);
