// [Usage]
// 名前
//     xargs - 標準入力を読み込んでコマンドラインを作成し、それを実行する
// 
// 書式
//     xargs [/n MAX-ARGS] [/max-args MAX-ARGS]
//     xargs [command [initial-arguments]]
//     xargs [/version] [/help]
// 
// 
// 説明
//     xargs は、標準入力から空白や改行で区切られた一連の項目を読み込み、それを引き数にして、
//     指定した command を実行する (デフォルトのコマンドは echo である)。 
// 
// OPTION
//     /n MAX-ARGS, /max-args MAX-ARGS
//         1 コマンドラインにつき最大 MAX-ARGS 個の引き数を使用する。
//         作成されたコマンドラインが、コマンドライン長の上限を 超過する場合は (-s オプション参照)、 max-args より少ない引き数が使用されることになる。
//         ただし、 -x オプションが指定されているときは別で、その場合は xargs が終了する。
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
function worning(m) {
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

function xargs(opts, command){
    function exec(command, cmdline){
        var line = "cmd /c " + command + cmdline.join(" ");
        var exec = shell.exec(line);
        while(!exec.stdout.AtEndOfStream){
            WScript.StdOut.WriteLine(exec.StdOut.ReadLine());
        }
        while(!exec.stderr.AtEndOfStream){
            WScript.StdErr.WriteLine(exec.stderr.ReadLine())
        }
    }
    var shell = new ActiveXObject("WScript.Shell");
    var stdin = WScript.StdIn;
    var CMDLINE_MAX_LENGTH = 8100;
    var MAX_ARGS = opts.max_args || Number.POSITIVE_INFINITY;
    var cmdline, arg, length, exec;
    
    if (stdin.AtEndOfStream) { return; }
    command = (command || "echo") + " ";
    arg = stdin.ReadLine();
    length = arg.length;
    cmdline = [arg];
    while(!stdin.AtEndOfStream) {
        arg = stdin.ReadLine();
        if (cmdline.length >= MAX_ARGS || arg.length + length >= CMDLINE_MAX_LENGTH) {
            exec(command, cmdline);
            length = 0;
            cmdline = [];
        }
        length += arg.length;
        cmdline.push(arg);
    }
    exec(command, cmdline);
}

// parse options
var arg, i, len, opts = {}, command = [];
for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg === "//") { break; }
    if (arg === "--") { break; }
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
    case "/n":
    case "/max_args":
        i++;
        opts.max_args = +get_next_arg(i);
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
        arg = '"' + arg + '"';
    }
    command.push(arg);
}

xargs(opts, command.join(" "));
