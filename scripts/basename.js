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

var prog_name = "basename";

function error(m) {
    WScript.StdErr.WriteLine(prog_name + ": " + m);
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
function echo(m) {
    WScript.Echo(m);
}
function get_next_arg(index) {
    if (index < WScript.Arguments.length) {
        return WScript.Arguments(index);
    } else {
        error(prog_name + "missing argument: " + WScript.Arguments(index - 1));
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
        case "s": i++; opts.suffix = get_next_arg(i); break;
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
        case "/suffix":
            i++;
            opts.suffix = get_next_arg(i);
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

// parse options
var args = parse_arguments();
var opts = args.opts;
var inputs = args.files;

// exec
var fso = WScript.CreateObject("Scripting.FileSystemObject");
var name, re = new RegExp(opts.suffix + "$");
for(i = 0, len = inputs.length; i < len; i++) {
    name = fso.getFileName(inputs[i]);
    WScript.StdOut.WriteLine(name.replace(re, ""));
}
