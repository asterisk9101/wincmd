// [Usage]
// 名前
//     cat - ファイルを連結して出力する  
// 
// 書式
//     cat [/A] [/show-all] [FILE...]
//     cat [/version] [/help]
// 
// 説明
//     cat は指定したファイルそれぞれの内容を標準出力へ書き出す。
//     FILE が一つも与えられないと標準入力から読み込む。
//     また FILE が `-' だった場合には、そのファイルには標準入力が用いられる。  
// 
// OPTION
//     /A, /show-all
//         制御文字を表示する。
// 
//     /?, /help
//         オプションについて簡単に説明し正常終了する。
// 
//     /v, /version
//         バージョン番号を表示して正常終了する。
// 

// [Version]
// cat.js version 0.1a

function error(m) {
    WScript.StdErr.WriteLine(m);
    WScript.Quit(1);
};
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
function get_next_arg(index) {
    if (index < WScript.Arguments.length) {
        return WScript.Arguments(index);
    } else {
        WScript.StdErr.WriteLine("xargs: arguments error");
        WScript.Quit(1);
    }
}
function echo(m) {
    WScript.Echo(m);
}

function cat(opts, files){
    function control_char(ch){
        switch(ch.charCodeAt(0)){
        case 9: ch = "^I"; break; // tab
        case 10: ch = "$\n"; break; // new line
        default: ch = ch.charCodeAt(0) < 32 ? ch = "^M" : ch; break;
        }
        return ch;
    }
    function read(opts, stream){
        var ch;
        if (opts.show_all) {
            while(!stream.AtEndOfStream){
                ch = stream.Read(1);
                ch = control_char(ch);
                WScript.StdOut.Write(ch);
            }
        } else {
            WScript.StdOut.Write(stream.ReadAll());
        }
    }
    var file, i, len;
    var fso = WScript.CreateObject("Scripting.FileSystemObject");
    if (files.length === 0) {
        read(opts, WScript.StdIn)
    } else {
        for (i = 0, len = files.length; i < len; i++) {
            if (files[i] === "-") {
                read(opts, WScript.StdIn);
            } else {
                file = fso.OpenTextFile(files[i]);
                read(opts, file);
                file.Close();
            }
        }
    }
}

// parse options
var arg, i, len, opts = {}, files = [];
opts.show_all = false;
for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg === "//") { break; }
    if (arg === "--") { break; }
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
    case "/A":
    case "/show-all":
        opts.show_all = true;
        break;
    case "/?":
    case "/help":
        view("Usage");
        WScript.Quit(0);
        break;
    case "/v":
    case "/version":
        view("Version");
        WScript.Quit(0);
        break;
    default:
        error("cat: invalid arguments. '" + arg + "'")
        break;
    }
}

// parse arguments
for(; i < len; i++) {
    files.push(WScript.Arguments(i));
}
cat(opts, files);
