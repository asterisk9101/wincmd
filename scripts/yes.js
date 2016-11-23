// [Usage]
// ���O
//     yes - �I�������܂ŕ�������J��Ԃ��o�͂���B
// 
// ���@
//     yes [STRING]...
//     yes OPTION
// 
// ����
//     �w�肳�ꂽ�S�Ă� STRING �܂��� 'y' ����Ȃ�s���J��Ԃ��o�͂��܂��B
// 
// OPTION
//     /?, /help
//         �w���v��\�����ďI������B
// 
//     /v, /version
//         �o�[�W���������o�͂��ďI������B
// 

// [Version]
// yes.js version 0.1

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
        WScript.StdErr.WriteLine("sed: arguments error");
        WScript.Quit(1);
    }
}
function echo(m) { WScript.Echo(m); } // print debug

function sed(opts, scripts, inputs) {
}

// parse options
var arg, i, len, strings = [];
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
        error("yes: invalid arguments. '" + arg + "'")
        break;
    }
}

// parse arguments
for(; i < len; i++){
    strings.push(WScript.Arguments(i));
}

var string = strings.length === 0 ? "y" : strings.join(" ");

try {
    while (true) {
        WScript.StdOut.WriteLine(string);
    }
} catch (e) {
    ;
}
