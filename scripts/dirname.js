// [Usage]
// 名前
//     dirname - パス名からディレクトリ名を切り出す
// 
// 文法
//     dirname PATH...
//     dirname [/?] [/help] [/v] [/version]
// 
// 説明
//     dirname は ファイル名 PATH の最後のバックスラッシュで区切られた部分を除いた全てを表示する。
// 
// OPTION
//     /f, /full
//         ディレクトリ名をフルパスで出力する。
// 
//     /?, /help
//         ヘルプを表示して終了する
// 
//     /v, /version
//         バージョン情報を出力して終了する
// 

// [Version]
// dirname.js version 0.1

var prog_name = "dirname";

function error(m) {
    WScript.StdErr.WriteLine(prog_name + ": " + m);
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
function get_opt(index, opts, files) {
    var i, len, ch;
    var arg = WScript.Arguments(index);
    if (arg[0] !== "/") { files.push(arg); return index; } 
    arg = arg.slice(1);
    for(i = 0, len = arg.length; i < len; i++){
        ch = arg[i];
        switch(ch){
        case "f": opts.full = true; break;
        case "?": view("Usage"); WScript.Quit(0);
        case "v": view("Version"); WScript.Quit(0);
        default: error("invalid argument: " + arg);;
        }
    }
    return index;
}
function parse_arguments(){
    var i, len, arg, opts = {}, files = [];
    for(i = 0, len = WScript.Arguments.length; i < len; i++){
        arg = WScript.Arguments(i);
        if (arg === "--" || arg === "//") { i++; break; }
        switch(arg) {
        case "/f":
        case "/full":
            opts.full = true;
            break;
        case "/help":
            view("Usage");
            WScript.Quit(0);
        case "/version":
            view("Version");
            WScript.Quit(0);
        default:
            i = get_opt(i, opts, files);
            break;
        }
    }
    for(; i < len; i++){
        arg = WScript.Arguments(i);
        files.push();
    }
    return {opts: opts, files: files };
}
var args, opts, inputs;
args = parse_arguments();
opts = args.opts;
inputs = args.files;

// exec
var fso = WScript.CreateObject("Scripting.FileSystemObject");
var dir;
for(i = 0, len = inputs.length; i < len; i++) {
    if (opts.full) { inputs[i] = fso.GetAbsolutePathName(inputs[i]); }
    dir = fso.getParentFolderName(inputs[i])
    WScript.StdOut.WriteLine(dir);
}
