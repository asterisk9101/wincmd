// [Usage]
// ���O
//     xargs - �W�����͂�ǂݍ���ŃR�}���h���C�����쐬���A��������s����
// 
// ����
//     xargs [/n MAX-ARGS] [/max-args MAX-ARGS]
//     xargs [command [initial-arguments]]
//     xargs [/version] [/help]
// 
// 
// ����
//     xargs �́A�W�����͂���󔒂���s�ŋ�؂�ꂽ��A�̍��ڂ�ǂݍ��݁A������������ɂ��āA
//     �w�肵�� command �����s���� (�f�t�H���g�̃R�}���h�� echo �ł���)�B 
// 
// OPTION
//     /n MAX-ARGS, /max-args MAX-ARGS
//         1 �R�}���h���C���ɂ��ő� MAX-ARGS �̈��������g�p����B
//         �쐬���ꂽ�R�}���h���C�����A�R�}���h���C�����̏���� ���߂���ꍇ�� (-s �I�v�V�����Q��)�A max-args ��菭�Ȃ����������g�p����邱�ƂɂȂ�B
//         �������A -x �I�v�V�������w�肳��Ă���Ƃ��͕ʂŁA���̏ꍇ�� xargs ���I������B
// 
//     /?, /help
//         �I�v�V�����ɂ��ĊȒP�ɐ���������I������B
// 
//     /v, /version
//         �o�[�W�����ԍ���\�����Đ���I������B
// 
// ��ʓI�� xargs �Ƃ̍���
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
        arg = '"' + arg + '"';
    }
    command.push(arg);
}

xargs(opts, command.join(" "));
