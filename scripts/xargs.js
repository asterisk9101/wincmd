// [Usage]
// 名前
//     xargs - 標準入力を読み込んでコマンドラインを作成し、それを実行する
// 
// 書式
//     xargs [/n MAX-ARGS] [/max-args MAX-ARGS]
//     xargs [command [initial-arguments]]
//     xargs [/version] [/help]
// 
// 説明
//     xargs は、標準入力から空白や改行で区切られた一連の項目を読み込み、それを引き数にして、
//     指定した command を実行する (デフォルトのコマンドは echo である)。 
// 
// OPTION
//     /I REPLACE-STR
//         xargs が実行するコマンドに対してユーザが引数（すなわち initial-arguments）を指定したとき
//         その initial-arguments の中にある REPLACE-STR の部分全てを、標準入力から読み込んだ名前で
//         置き換える。なお、空白は、クォートされていない場合も、入力される項目の区切りにはならない。
//         区切り記号は改行だけになる。
// 
//     /n MAX-ARGS, /max-args MAX-ARGS
//         1 コマンドラインにつき最大 MAX-ARGS 個の引き数を使用する。
// 
//     /?, /help
//         オプションについて簡単に説明し正常終了する。
// 
//     /v, /version
//         バージョン番号を表示して正常終了する。
// 
// 一般的な xargs との差異
// 

// [Version]
// xargs.js version 0.1a

function error(m) {
    WScript.StdErr.WriteLine(m);
    WScript.Quit(1);
};
function warning(m) {
    WScript.StdErr.WriteLine(m);
}
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
        WScript.StdErr.WriteLine("xargs: arguments error");
        WScript.Quit(1);
    }
}
function echo(m) {
    WScript.Echo(m);
}

function xargs(opts, cmd){
    function exec(opts, cmd, argstr){
        var exec, proc = "cmd /c ";
        if (opts.I) {
            cmd = cmd.split(opts.I).join(argstr);
        } else {
            cmd = cmd + " " + argstr;
        }
        
        exec = shell.exec(proc + cmd);
        while(!exec.stdout.AtEndOfStream){
            WScript.StdOut.WriteLine(exec.StdOut.ReadLine());
        }
        while(!exec.stderr.AtEndOfStream){
            WScript.StdErr.WriteLine(exec.stderr.ReadLine())
        }
    }
    var shell = new ActiveXObject("WScript.Shell");
    var CMDLINE_MAX_LENGTH = 8100;
    var MAX_ARGS = opts.max_args || Number.POSITIVE_INFINITY;
    var args, arg, length;
    
    if (WScript.StdIn.AtEndOfStream) { return; }
    cmd = cmd !== "" ? cmd : "echo";
    args = [];
    length = 0;
    while(!WScript.StdIn.AtEndOfStream) {
        arg = WScript.StdIn.ReadLine();
        length += arg.length + 1;
        args = [arg];
        while(!WScript.StdIn.AtEndOfStream){
            if (length >= CMDLINE_MAX_LENGTH) { break; }
            if (args.length >= MAX_ARGS) { break; }
            arg = WScript.StdIn.ReadLine();
            length += arg.length + 1;
            args.push(arg);
        }
        exec(opts, cmd, args.join(" "));
    }
}

// parse options
var arg, i, len, opts = {}, command = [];
for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg === "//") { break; }
    if (arg === "--") { break; }
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
    case "/I":
        i++;
        opts.I = get_next_arg(i);
        opts.max_args = 1;
        break;
    case "/n":
    case "/max_args":
        i++;
        opts.max_args = +get_next_arg(i);
        delete opts.I;
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
        error("xargs: invalid arguments. '" + arg + "'")
        break;
    }
}

for(; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg.indexOf(" ") > -1) {
        arg = '"' + arg.split("\"").join("\\\"") + '"';
    }
    command.push(arg);
}

xargs(opts, command.join(" "));
