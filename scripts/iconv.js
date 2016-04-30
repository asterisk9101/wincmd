// [Usage]
// 名前
//     iconv - 文字セット変換を行う
// 
// 書式
//     iconv [/f CHAR_CODE] [/from-code CHAR_CODE] [/t CHAR_CODE] [/to-code CHAR_CODE] [/o OUTPUT] [/output OUTPUT] FILE
//     iconv [/l] [/list] [/?] [/v] [/version] [/help]
// 
// 説明
//     iconv は与えられたファイルのエンコーディングを、
//     あるエンコーディングから別のエンコーディングに変換します。
// 
// OPTION
//     /f CHAR_CODE, /from-code CHAR_CODE
//         元のテキストのエンコーディングを CHAR_CODE で指定します。既定値は Shift_JIS です。
// 
//     /t CHAR_CODE, /to-code CHAR_CODE
//         出力用のエンコーディングを CHAR_CODE で指定します。既定値は Shift_JIS です。
// 
//     /o OUTPUT, /output OUTPUT
//         出力ファイルを指定する。指定しない場合は標準出力に出力します。
//         出力先を指定しない場合の出力文字コードは必ず Shift_JIS です。
// 
//     /l, /list
//         変換可能な文字コードのリストを表示して正常終了する。
//         
//     /?, /help
//         オプションについて簡単に説明し正常終了する。
// 
//     /v, /version
//         バージョン番号を表示して正常終了する。
// 

// [Version]
// iconv.js version 0.1a
var prog_name = "iconv";

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

function iconv(opts, path){
    var input = WScript.CreateObject("ADODB.Stream");
    var translate = WScript.CreateObject("ADODB.Stream");
    var output;
    
    input.Charset = opts.from_code;
    input.Open();
    input.LoadFromFile = path;
    
    translate.Charset = opts.to_code === "UTF-8N" ? "UTF-8" : opts.to_code;
    translate.Open();
    input.CopyTo(translate);
    
    input.Close();
    
    if (opts.output && opts.output !== "") {
        if (opts.to_code === "UTF-8N") {
            translate.position = 0;
            translate.type = 1; // binary mode
            translate.position = 3; // skip BOM
            output = WScript.CreateObject("ADODB.Stream");
            output.type = 1;
            output.Open();
            output.Write(translate.Read());
            output.SaveToFile(opts.output, 2);
        } else {
            translate.SaveToFile(opts.output, 2);
        }
    } else {
        translate.position = 0;
        translate.Charset = "Shift_JIS";
        WScript.StdOut.WriteLine(translate.ReadText(-1));
    }
    translate.Close();
}
function list() {
    var shell = WScript.CreateObject("WScript.Shell");
    var exec = shell.exec("reg query HKEY_CLASSES_ROOT\\MIME\\Database\\Charset");
    var line, trim = /^\s*|\s*$/, code = /^.*\\/;
    while(!exec.StdOut.AtEndOfStream){
        line = exec.StdOut.ReadLine();
        line = line.replace(trim, "");
        line = line.replace(code, "");
        if (line === "") continue;
        WScript.StdOut.WriteLine(line);
    }
}

// parse options
var arg, i, len, opts = {}, files = [];
opts.preview = void 0;
opts.from_code = "SJIS";
opts.to_code = "SJIS";
opts.output = void 0; // stdout
for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg === "//") { break; }
    if (arg === "--") { break; }
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
    case "/f":
    case "/from-code":
        i++;
        opts.from_code = get_next_arg(i).toUpperCase();
        break;
    case "/t":
    case "/to_code":
        i++;
        opts.to_code = get_next_arg(i).toUpperCase();
        break;
    case "/o":
    case "/output":
        i++;
        opts.output = get_next_arg(i);
        break;
    case "/l":
    case "/list":
        list();
        WScript.Quit(0);
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
    file = WScript.Arguments(i);
} else {
    file = "-";
}

iconv(opts, file);
