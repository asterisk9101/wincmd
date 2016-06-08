// [Usage]
// ���O
//     msort - �e�L�X�g�t�@�C�����\�[�g����
// 
// ���@
//     msort [option]... [FILE...]
//     msort [/?] [/help] [/v] [/version]
// 
// ����
//     msort �͗^����ꂽ�e FILE ���\�[�g�E�}�[�W�E��r����B
//     ���ʂ͌�������ĕW���o�͂ɏ����o�����B 
//     FILE ������^�����Ȃ��ƕW�����͂���ǂݍ��ށB
//     �܂� FILE �� `-' �������ꍇ�ɂ́A���̃t�@�C���ɂ͕W�����͂��p������B
// 
//     �\�[�g�L�[�̃I�v�V�����ɂ́A �o�͏����I�v�V���� (output ordering option) 
//     ���܂߂邱�Ƃ��ł��A���̏ꍇ�̓O���[�o���ȏ����I�v�V�����͂��̃t�B�[���h�ɂ͗p�����Ȃ��B
// 
// OPTION
//     /k FIELD
//         �\�[�g�t�B�[���h���w�肷��B�����w�肷�邱�Ƃ��ł���B
//         FIELD �̏����͈ȉ��̒ʂ�B
// 
//             FIELD = �t�B�[���h�ԍ�[nrf]
// 
//         �t�B�[���h�ԍ��� 0 �ȏ�̐������w�肷��B0 �͍s�S�̂�\���B
//         POSIX �`���ł͂Ȃ��B
// 
//     /S SIZE
//         ��x�ɓǂݍ��ލs�����w�肷��B
//         ���̍s���𒴂���t�@�C����ǂݍ��񂾏ꍇ�͈ꎞ�t�@�C�����쐬�����B
//         �f�t�H���g�ł� 102400 �s��ǂݍ��ށB
//         
//     /o OUTFILE
//         �o�͐��W���o�͂��� OUTFILE �ɕύX����B
// 
//     /T DIR
//         /S �I�v�V�����Ŏw�肳�ꂽ�s���𒴂���t�@�C�����\�[�g����ꍇ��
//         �ꎞ�t�@�C�����쐬�����t�H���_���w�肷��B
//         �f�t�H���g�ł̓J�����g�f�B���N�g�����ݒ肳���B
//         
//     /M DIR
//         /S �I�v�V�����Ŏw�肳�ꂽ�s����2�{�𒴂���t�@�C�����\�[�g����ꍇ��
//         �ꎞ�t�@�C�����쐬�����t�H���_���w�肷��B
//         �f�t�H���g�ł� /T �Ɠ����t�H���_���w�肳��邪�A/T �Ƃ͕ʂ̃f�B�X�N��
//         �w�肷��ƃp�t�H�[�}���X�����シ��\��������B
//         
//     /b
//         �e�s�̔�r�̍ۂɁA�s���̋󔒂𖳎�����B
// 
//     /f
//         ��������Ή�����啶���Ɠ����Ɉ����B �Ⴆ�� `b' �� `B' �Ɠ����Ƃ݂Ȃ����B
// 
//     /n
//         ���l���ɕ]������B������� JScript �� Number �^�ɕϊ������B
// 
//     /r
//         ��r�̌��ʂ��t���ɂ���B���傫�ȃL�[�l�����s���A ��葁��������悤�ɂȂ�B
// 
//     /t SEPARATOR
//         �e�s����\�[�g�L�[����������ہA���� SEPARATOR ���t�B�[���h�̃Z�p���[�^�[�ɂ���B
//         �f�t�H���g�� SEPARATOR �͋󔒂��w�肳���B
// 
//     /?, /help
//         �w���v��\�����Đ���I�����܂��B
// 
//     /v, /version
//         �o�[�W���������o�͂��Đ���I�����܂��B
// 
// ��ʓI�� sort �R�}���h�Ƃ̍���
//     - /k �I�v�V������ POSIX �W���ł͂Ȃ��B
//     - �������̃I�v�V�����͎�������Ă��Ȃ� (u, c, m, d etc.)�B
//     - ��s����������ꍇ�̓���͍l������Ă��Ȃ��i������̖�肪���邩������Ȃ��j�B
//     - ���s�R�[�h�� CRLF �ł���B
// 

// [Version]
// msort.js version 0.1

var prog_name = "msort";

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
    if (arg.charAt(0) !== "/") { files.push(arg); return index; } 
    arg = arg.slice(1);
    for(i = 0, len = arg.length; i < len; i++){
        ch = arg.charAt(i);
        switch(ch){
        case "?": view("Usage"); WScript.Quit(0);
        case "v": view("Version"); WScript.Quit(0);
        default: error("invalid argument: " + arg);;
        }
    }
    return index;
}
function parse_arguments(){
    var i, len, arg, opts = {}, files = [];
    i = 0;
    len = WScript.Arguments.length;
    opts.keys = [];
    opts.f = false; // ignore case
    opts.t = " "; // separator
    opts.r = false; // reverse
    opts.outfile = "-"; // stdout
    opts.b = false; // ignore blank
    opts.tempdir = "";
    opts.u = false; // unique
    opts.bufferSize = 1024; // line num
    opts.mergedir = "";
    for(; i < len; i++){
        arg = WScript.Arguments(i);
        if (arg === "--" || arg === "//") { i++; break; }
        switch(arg) {
        case "/": error("invalid argument: '/'");
        case "/S": i++; opts.bufferSize = +get_next_arg(i); break;
        case "/T": i++; opts.tempdir = get_next_arg(i); break;
        case "/D": i++; opts.mergedir = get_next_arg(i); break;
        case "/b": opts.b = true; break;
        case "/f": opts.f = true; break;
        case "/k": i++; opts.keys.push(get_next_arg(i)); break;
        case "/r": opts.r = true; break;
        case "/o": i++; opts.outfile = get_next_arg(i); break;
        case "/t": i++; opts.t = get_next_arg(i); break;
        case "/u": opts.u = true; break;
        case "/help": view("Usage"); WScript.Quit(0);
        case "/version": view("Version"); WScript.Quit(0);
        default: i = get_opt(i, opts, files); break;
        }
    }
    for(; i < len; i++){
        arg = WScript.Arguments(i);
        files.push(arg);
    }
    if (opts.keys.length === 0) { opts.keys.push("0"); }
    if (files.length === 0) { files.push("-"); }
    return {opts: opts, files: files };
}
function msort(opts, files) {
    function error(m) {
        throw new Error(m);
    }
    function mergesort(a, begin, end, work) {
        var mid;
        if (end - begin < 64) {
            insertsort(a, begin, end - 1);
            return;
        }
        mid = Math.floor((begin + end) / 2);
        mergesort(a, begin, mid, work);
        mergesort(a, mid, end, work);
        merge(a, begin, mid, end, work);
    }
    function insertsort(a, first, last) {
        var i, j, tmp;
        for (i = first + 1; i <= last; i++) {
            for (j = i; j > first && compare(a[j - 1], a[j]); j--) {
                tmp = a[j];
                a[j] = a[j - 1];
                a[j - 1] = tmp;
            }
        }
    }
    function merge(a, begin, mid, end, work) {
        var i, j, k;
        for(i = begin, j = 0; i !== mid; i++, j++) {
            work[j] = a[i];
        }
        mid -= begin;
        for(j = 0, k = begin; i !== end && j !== mid; k++) {
            if (!compare(a[i], work[j])) {
                a[k] = a[i];
                i++;
            } else {
                a[k] = work[j];
                j++;
            }
        }
        for(; i < end; i++, k++) { a[k] = a[i]; }
        for(; j < mid; j++, k++) { a[k] = work[j]; }
    }
    function mergefile(a, tempPath, outPath) {
        var i, len, line;
        var temp = fso.OpenTextFile(tempPath);
        var out = outPath === "-" ? WScript.StdOut : fso.OpenTextFile(outPath, 2, true);
        for (i = 0, len = a.length, line = temp.ReadLine(); i < len && !temp.AtEndOfStream;) {
            if (!compare(a[i], line)) {
                out.WriteLine(a[i]);
                i++;
            } else {
                out.WriteLine(line);
                line = temp.ReadLine();
            }
        }
        for (; i < len; i++) { out.WriteLine(a[i]); }
        while (!temp.AtEndOfStream) { out.WriteLine(temp.ReadLine()); }
        temp.Close();
        out.Close();
    }
    function compare(a, b) {
        var i, len, key, trim = /^\s+|\s+$/, ret, fa, fb;
        ret = false;
        fa = a;
        fb = b;
        for(i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            
            // select field
            if (key.index < 0) {
                error("invalid column index. '" + key.index + "'");
            } else if (key.index !== 0) {
                fa = a.split(delim)[key.index - 1];
                fb = b.split(delim)[key.index - 1];
            }
            
            // normalize
            if (key.type === "n") {
                fa = +fa;
                fb = +fb;
            } else if (key.type === "s") {
                if (key.opts.f) {
                    fa = fa.toUpperCase();
                    fb = fb.toLowerCase();
                }
                if (key.opts.b) {
                    fa = fa.replace(trim, "");
                    fb = fb.replace(trim, "");
                }
            }
            
            // compare
            if (fa !== fb) {
                if (key.opts.r) {
                    return fa < fb;
                } else {
                    return fa > fb;
                }
            }
        }
    }
    var keys = opts.keys.map(function (key) {
        // type
        //   s: string
        //   n: number
        // opt
        //   f: ignore case
        //   b: ignore blank
        //   r: reverse
        var index = 0, type = "s";
        var o = {
            f: opts.f || false,
            b: opts.b || false,
            r: opts.r || false
        };
        var i, ch;
        i = 0;
        ch = key.charAt(i);
        while("0" <= ch && ch <= "9") {
            index = index * 10 + (+ch);
            i++;
            ch = key.charAt(i);
        }
        while (i < key.length) {
            switch (ch) {
            case "n":
            case "s": type = ch; break;
            case "f": o.f = true; break;
            case "b": o.b = true; break;
            case "r": o.r = true; break;
            default: error("invalid sort option. '" + ch + "'");
            }
            i++;
            ch = key.charAt(i);
        }
        return { index: index, type: type, opts: o};
    });
    
    
    var fso = WScript.CreateObject("Scripting.FileSystemObject");
    var delim = opts.t;
    var uniq = opts.u;
    var buffer = opts.bufferSize;
    var memory = [], work;
    var input = files_stream(files, opts.br), out, merge, temp;
    var tempPath = "", outPath = "", mergePath = "", path = "";
    var i, len;
    for (i = 0; i < buffer; i++) {
        if (input.AtEndOfStream) { break; }
        memory.push(input.ReadLine());
    }
    work = new Array(Math.floor(memory.length / 2));
    
    // in core sort
    mergesort(memory, 0, memory.length, work);
    if (input.AtEndOfStream) {
        out = opts.outfile === "-" ? WScript.StdOut : fso.OpenTextFile(opts.outfile, 2, true);
        for (i = 0, len = memory.length; i < len; i++) {
            out.WriteLine(memory[i]);
        }
        return;
    }
    
    // out core sort(temp only)
    tempPath = opts.tempdir === "" ? fso.GetTempName(): fso.BuildPath(opts.tempdir, "~msort1.tmp");
    temp = fso.OpenTextFile(tempPath, 2, true);
    for (i = 0, len = memory.length; i < len; i++) {
        temp.WriteLine(memory[i]);
    }
    temp.Close();
    for (i = 0; i < buffer; i++) {
        if (input.AtEndOfStream) { break; }
        memory[i] = input.ReadLine();
    }
    if (input.AtEndOfStream) {
        memory = memory.slice(0, i - 1);
        mergesort(memory, 0, memory.length, work);
        mergefile(memory, tempPath, opts.outfile);
        fso.DeleteFile(tempPath);
        return;
    }
    
    // out core sort(temp and merge)
    mergesort(memory, 0, memory.length, work);
    mergePath = opts.mergedir === "" ? fso.GetTempName(): fso.BuildPath(opts.mergedir, "~msort2.tmp");
    mergefile(memory, tempPath, mergePath);
    
    // swap path
    path = tempPath;
    tempPath = mergePath;
    mergePath = path;
    
    while (!input.AtEndOfStream) {
        for (i = 0; i < buffer; i++) {
            if (input.AtEndOfStream) { break; }
            memory[i] = input.ReadLine();
        }
        if (input.AtEndOfStream) {
            memory = memory.slice(0, i - 1);
            mergesort(memory, 0, memory.length, work);
            mergefile(memory, tempPath, opts.outfile);
            fso.DeleteFile(tempPath);
            fso.DeleteFile(mergePath);
        } else {
            mergesort(memory, 0, memory.length, work);
            mergefile(memory, tempPath, mergePath);
            // swap path
            path = tempPath;
            tempPath = mergePath;
            mergePath = path;
        }
    }
}
function files_stream (paths, br_pattern) {
    // �����̃t�@�C���p�X���󂯎��A������̓��e��A�������X�g���[���Ƃ��ďo�͂���B
    // ������ paths �Ƃ��āA�t�@�C���p�X�̔z�� (Array<String>) ���󂯎��B
    // ������ br_pattern �Ƃ��āA�t�@�C���̉��s�R�[�h (String) ���󂯎��B
    // �߂�l�Ƃ��āAfiles_stream(Object) ��Ԃ��B
    var br = br_pattern || "\r\n";
    var file = null;
    var AtEndOfStream = false;
    var at = 0, ch;
    var open = true;
    var fso = WScript.CreateObject("Scripting.FileSystemObject");
    
    function echo(m) {
        WScript.StdOut.WriteLine(m);
    }
    function alert(m) {
        WScript.StdErr.WriteLine("files_stream: alert: " + m);
    }
    function error(m) {
        WScript.StdErr.WriteLine("files_stream: error: " + m);
        WScript.Quit(1);
    }
    function get_file() {
        while (file === null || file.AtEndOfStream && at < paths.length) {
            try {
                if (file !== null) { file.Close(); }
                file = paths[at] === "-" ? WScript.StdIn : fso.OpenTextFile(paths[at]);
            } catch(e) {
                alert("file open fail. " + paths[at]);
            }
            at++;
        }
        if (file === null) {
            error("all files open fail.");
        }
    }
    function next_char() {
        if (file.AtEndOfStream) { get_file(); }
        if (file.AtEndOfStream) { return ""; }
        ch = file.Read(1);
        return ch;
    }
    function read(n) {
        var buf = [], i;
        for(i = 0; i < n; i++) {
            buf.push(ch);
            next_char()
        }
        
        if (file.AtEndOfStream && at >= paths.length) {
            this.AtEndOfStream = true;
        }
        return buf.join("");
    }
    function readline() {
        var buf;
        if (this.br === "\r\n") {
            get_file();
            buf = file.ReadLine();
        } else {
            buf = [];
            next_char();
            while(ch !== "") {
                if (ch === this.br) { break; }
                buf.push(ch);
                next_char();
            }
            buf = buf.join("");
        }
        this.AtEndOfStream = file.AtEndOfStream && at >= paths.length
        return buf;
    }
    function Close() {
        file.Close();
        open = false;
    }
    
    br = br_pattern || "\r\n";
    file = null;
    at = 0;
    AtEndOfStream = true;
    
    if (paths.length !== 0) {
        get_file(); // set file
        AtEndOfStream = file ? file.AtEndOfStream : false;
    }
    return {
        AtEndOfStream: AtEndOfStream, 
        br: br, 
        Read: read, 
        ReadLine: readline,
        Close: Close
    };
}
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function(callback, thisArg) {
        var T, A, k;
        if (this == null) {
            throw new Error(" this is null or not defined");
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if ({}.toString.call(callback) != "[object Function]") {
            throw new Error(callback + " is not a function");
        }
        if (thisArg) {
            T = thisArg;
        }
        A = new Array(len);
        k = 0;
        while(k < len) {
            var kValue, mappedValue;
            if (k in O) {
                kValue = O[ k ];
                mappedValue = callback.call(T, kValue, k, O);
                A[ k ] = mappedValue;
            }
            k++;
        }
        return A;
    };
}

var args, opts, files;
args = parse_arguments();
opts = args.opts;
files = args.files;

msort(opts, files);
