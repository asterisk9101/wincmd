// [Usage]
// ���O
//     xargs - �W�����͂�ǂݍ���ŃR�}���h���C�����쐬���A��������s����
// 
// ����
//     xargs [/n MAX-ARGS] [/max-args MAX-ARGS]
//     xargs [command [initial-arguments]]
//     xargs [/version] [/help]
// 
// ����
//     xargs �́A�W�����͂���󔒂���s�ŋ�؂�ꂽ��A�̍��ڂ�ǂݍ��݁A������������ɂ��āA
//     �w�肵�� command �����s���� (�f�t�H���g�̃R�}���h�� echo �ł���)�B 
// 
// OPTION
//     /I REPLACE-STR
//         xargs �����s����R�}���h�ɑ΂��ă��[�U�������i���Ȃ킿 initial-arguments�j���w�肵���Ƃ�
//         ���� initial-arguments �̒��ɂ��� REPLACE-STR �̕����S�Ă��A�W�����͂���ǂݍ��񂾖��O��
//         �u��������B�Ȃ��A�󔒂́A�N�H�[�g����Ă��Ȃ��ꍇ���A���͂���鍀�ڂ̋�؂�ɂ͂Ȃ�Ȃ��B
//         ��؂�L���͉��s�����ɂȂ�B
// 
//     /n MAX-ARGS, /max-args MAX-ARGS
//         1 �R�}���h���C���ɂ��ő� MAX-ARGS �̈��������g�p����B
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

function xargs(opts, init_args){
    function blankQuote(str) {
        return str.indexOf(" ") === -1 ? str : "\"" + str + "\"";
    }
    function exec(opts, init_args, args){
        var exec, proc = "cmd /c ", cmdline;
        
        init_args = init_args.map(blankQuote);
        
        if (opts.I) {
            cmdline = init_args.join(" ").split(opts.I).join(args.join(" "));
        } else {
            cmdline = init_args.join(" ") + " " + args.join(" ");
        }
        
        if (opts.debug) {
            WScript.StdOut.WriteLine(cmdline);
        } else {
            exec = shell.exec(proc + cmdline);
            while(!exec.stdout.AtEndOfStream){
                WScript.StdOut.WriteLine(exec.StdOut.ReadLine());
            }
            while(!exec.stderr.AtEndOfStream){
                WScript.StdErr.WriteLine(exec.stderr.ReadLine())
            }
        }
    }
    var shell = WScript.CreateObject("WScript.Shell");
    var CMDLINE_MAX_LENGTH = 8100;
    var MAX_ARGS = opts.max_args || Number.POSITIVE_INFINITY;
    var args, arg, length;
    init_args = init_args.length === 0 ? ["echo"] : init_args;
    
    if (WScript.StdIn.AtEndOfStream) { return; }
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
        exec(opts, init_args, args);
    }
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function(callback, thisArg) {
        var T, A, k;
        if (this == null) { throw new Error(' this is null or not defined'); }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== 'function') { throw new Error(callback + ' is not a function'); }
        if (arguments.length > 1) { T = thisArg; }
        A = new Array(len);
        k = 0;
        while (k < len) {
            var kValue, mappedValue;
            if (k in O) {
                kValue = O[k];
                mappedValue = callback.call(T, kValue, k, O);
                A[k] = mappedValue;
            }
            k++;
        }
        return A;
    };
}

// parse options
var arg, i, len, opts = {}, init_args = [];
for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg === "//") { break; }
    if (arg === "--") { break; }
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
    case "/whatif":
    case "/debug":
        opts.debug = true;
        break;
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
    init_args.push(arg);
}

xargs(opts, init_args);
