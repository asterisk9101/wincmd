// [Usage]
// ���O
//     basename - �t�@�C��������f�B���N�g���ƃT�t�B�b�N�X����菜��
// 
// ���@
//     basename [OPTION]... NAME...
// 
// ����
//     basename �R�}���h�̓t�@�C���� NAME ����f�B���N�g��������苎��B
//     basename �͂��̏��������� name ��W���o�͂ɕ\������B  
// 
// OPTION
//     /s suf, /suffix suf
//         ��������T�t�B�b�N�X���w�肷��B
//     /?, /help
//         �w���v��\�����ďI������
// 
//     /v, /version
//         �o�[�W���������o�͂��ďI������
// 
// ��ʓI�� dirname �Ƃ̍���
//     ��� -a �I�v�V�������w�肳��Ă����ԂƂȂ�

// [Version]
// basename.js version 0.1

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
        WScript.StdErr.WriteLine("basename: arguments error");
        WScript.Quit(1);
    }
}
function echo(m) { WScript.Echo(m); } // print debug


// parse options
var fso = WScript.CreateObject("Scripting.FileSystemObject");
var arg, i, len, suffix, inputs = [];

for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg === "//") { break; }
    if (arg === "--") { break; }
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
    case "/s":
    case "/suffix":
        i++;
        suffix = get_next_arg(i);
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
        error("basename: invalid arguments. '" + arg + "'")
        break;
    }
}

// parse arguments
for(; i < len; i++) {
    inputs.push(WScript.Arguments(i));
}

// exec
var list, name, re = new RegExp(suffix + "$");
for(i = 0, len = inputs.length; i < len; i++) {
    list = inputs[i].split("\\");
    name = list.pop();
    if (name === "") { name = list.pop(); }
    WScript.StdOut.WriteLine(name.replace(re, ""));
}
