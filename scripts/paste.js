// [Usage]
// ���O
//     paste - �t�@�C�����s�P�ʂŃ}�[�W����  
// 
// ���@
//     paste [/s] [/serial] [/d DELIM] [/delimiter DELIM] [FILE...]
//     paste [/help] [/version]  
// 
// ����
//     paste �͗^����ꂽ���ꂼ��� FILE ����A�����s�ԍ��̍s��A�����ĕW���o�͂ɏ����o���B
//     ��؂蕶���ɂ� <TAB> ���p������B FILE ������^�����Ȃ��ƕW�����͂���ǂݍ��ށB
//     �܂� FILE �� `-' �������ꍇ�ɂ́A���̃t�@�C���ɂ͕W�����͂��p������B
// 
// OPTION
//     /d DELIM, /delimiter DELIM
//         �}�[�W����t�@�C���Ԃ̃Z�p���[�^�ɁA <TAB> �ł͂Ȃ� DELIM ��p����B
// 
//     /s, /serial
//         �e�t�@�C������ 1 �s�Âǂݍ��ނ̂ł͂Ȃ��A �t�@�C���P�ʂ� 1 �s�ɂ܂Ƃ߂Ă����B
// 
//     /?, /help
//         �w���v��\�����ďI������
// 
//     /v, /version
//         �o�[�W���������o�͂��ďI������
// 
// ��ʓI�� paste �Ƃ̍���
//     ���ɂȂ�

// [Version]
// paste.js version 0.1

function error(m) {
    WScript.StdErr.WriteLine("paste: error: " + m);
    WScript.Quit(1);
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
        WScript.StdErr.WriteLine("paste: arguments error. ");
        WScript.Quit(1);
    }
}
function echo(m) {
    WScript.Echo(m); // print debug
}
function open(path) {
    var fso = WScript.CreateObject("Scripting.FileSystemObject");
    if (path === "-") {
        return WScript.StdIn;
    } else {
        return fso.OpenTextFile(path);
    }
}

// parse options
var arg, i, len, serial, delim, file = [];
serial = false;
delim = "\t";

for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg === "//") { break; }
    if (arg === "--") { break; }
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
    case "/d":
    case "/delimiter":
        i++;
        delim = get_next_arg(i);
        break;
    case "/s":
    case "/serial":
        serial = true;
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
        error("paste: invalid arguments. '" + arg + "'")
        break;
    }
}

// parse arguments
for(; i < WScript.Arguments.length; i++) {
    file.push(WScript.Arguments(i));
}

// exec
var fp, text, br = "\r\n";
if (serial) {
    for(i = 0, len = file.length; i < len; i++) {
        fp = open(file[i]);
        while(!fp.AtEndOfStream) {
            WScript.StdOut.Write(fp.ReadLine());
            WScript.StdOut.Write(fp.AtEndOfStream ? br : delim);
        }
        // fp.Close(); // not close WScript.StdIn
    }
} else {
    fp = [];
    for(i = 0, len = file.length; i < len; i++) {
        fp.push(open(file[i]));
    }
    while(true){
        for(i = 0, len = fp.length; i < len; i++) {
            if (!fp[i].AtEndOfStream) { break; }
        }
        if (i >= fp.length) { break; }
        for(i = 0, len = fp.length; i < len; i++) {
            text = fp[i].AtEndOfStream ? "" : fp[i].ReadLine();
            WScript.StdOut.Write(text);
            WScript.StdOut.Write(i === fp.length - 1 ? br : delim);
        }
    }
}
for(i = 0, len = fp.length; i < len; i++){
    fp[i].Close();
}