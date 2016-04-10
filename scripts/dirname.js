// [Usage]
// 名前
//     dirname - パス名からファイル名を切り出す
// 
// 文法
//     dirname path 
//     dirname {/help,/version}  
// 
// 説明
//     dirname は ファイル名(filename) の最後のバックスラッシュで区切られた部分を除いた全てを表示する。
// 
// OPTION
//     /?, /help
//         ヘルプを表示して終了する
// 
//     /v, /version
//         バージョン情報を出力して終了する
// 
// 一般的な dirname との差異
//     出力の末尾に \ は付かない。

// [Version]
// dirname.js version 0.1

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
        WScript.StdErr.WriteLine("dirname: arguments error");
        WScript.Quit(1);
    }
}
function echo(m) { WScript.Echo(m); } // print debug


// parse options
var fso = WScript.CreateObject("Scripting.FileSystemObject");
var arg, i, len, inputs = [];

for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg === "//") { break; }
    if (arg === "--") { break; }
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
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
        error("dirname: invalid arguments. '" + arg + "'")
        break;
    }
}

// parse arguments
for(; i < len; i++) {
    inputs.push(WScript.Arguments(i));
}

// exec
var dir;
for(i = 0, len = inputs.length; i < len; i++) {
    dir = inputs[i].split("\\");
    if (dir.pop() === "") { dir.pop();}
    if (dir.length === 0) {
        WScript.StdOut.WriteLine(".");
    } else {
        WScript.StdOut.WriteLine(dir.join("\\"));
    }
}
