// [Usage]
// ���O
//        tail - �t�@�C���̖���������\������
// 
// ����
//        tail [OPTION]... [FILE]
// 
// ����
//        ���ꂼ��� FILE �̖��� 10 �s��W���o�͂֏o�͂���B
//        ������ FILE ���^����ꂽ�ꍇ�́A�^����ꂽ�t�@�C�������w�b�_�Ƃ��Đ�ɏo�͂���B
//        FILE ���^�����Ȃ������ꍇ�A���邢�� FILE �� - �̏ꍇ�ɂ͕W�����͂���ǂݍ��ށB
// 
//        /c K, /chars K
//               ���� K ����(���s�����܂�)���o�͂���; �e�t�@�C���� K �����ڂ���o�͂��J�n����ɂ́A����� +K ���g���B
// 
//        /f, /follow
//               �t�@�C���̓��e�����������鎞�A�ǉ����ꂽ�f�[�^���o�͂���B
// 
//        /F
//               /follow /retry �Ɠ����ł���B
// 
//        /n, /lines K
//               ���� 10 �s�̑���ɖ��� K �s���o�͂���; �e�t�@�C���� K �s�ڂ���o�͂��J�n����ɂ́A����� +K ���g���B
// 
//        /retry
//               �t�@�C�����A�N�Z�X�ł��Ȃ��A���邢�̓A�N�Z�X�ł��Ȃ��Ȃ낤�Ƃ��Ă����Ƃ��Ă��A
//               �t�@�C���̃I�[�v�����J��Ԃ�; /follow �ŒǐՂ��Ă���ꍇ�ɗL�p�ł���B
// 
//        /s, /sleep-interval N
//               -f �Ƌ��Ɏg�p����B�ǐՂ��Ă���t�@�C���̃`�F�b�N�� N �b���ɍs���B (�f�t�H���g�� 1.0 �b)
// 
//        /help ���̃w���v��\�����ďI������B
// 
//        /version
//               �o�[�W��������\�����ďI������B
// 
// ����
//       �t�@�C���L�q�q���g�����ǐՂ͂ł��Ȃ��B��Ƀt�@�C�������g�p����B
//       �I���W�i���� tail �R�}���h�ƈ���ĕ����t�@�C���𓯎��ɏ����ł��Ȃ��B

// [Version]
// tail version 0.2

var prog_name = "tail";
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
        case "F":
            opts.follow = true;
            opts.retry = true;
            break;
        case "f":
            opts.follow = true;
            break;
        case "?":
            view("Usage");
            WScript.Quit(0);
        case "v":
            view("Version");
            WScript.Quit(0);
        default:
            error("invalid argument: " + arg);;
        }
    }
    return index;
}
function parse_arguments(){
    var i, len, arg, opts = {}, files = [];
    
    opts.line_mode = true;
    opts.n = -10;
    opts.retry = false;
    opts.follow = false;
    opts.interval = 1;
    
    i = 0;
    len = WScript.Arguments.length;
    for(; i < len; i++){
        arg = WScript.Arguments(i);
        if (arg === "--" || arg === "//") { i++; break; }
        switch(arg) {
        case "/":
            error("invalid argument: '/'");
        case "/c":
        case "/chars":
            i++;
            opts.n = get_next_arg(i);
            // check convertable string->number
            if(/^(\+|-)?\d+/.test(opts.n)) {
                opts.n = opts.n.charAt(0) === "+" ? +opts.n : -opts.n;
            } else {
                error("invalid number: " + opts.n);
            } 
            opts.line_mode = false;
            break;
        case "/n":
        case "/lines":
            i++;
            opts.n = get_next_arg(i);
            // check convertable string->number
            if(/^(\+|-)?\d+/.test(opts.n)){
                opts.n = opts.n.charAt(0) === "+" ? +opts.n : -opts.n;
            } else {
                error("invalid number: " + opts.n);
            }
            opts.line_mode = true;
            break;
        case "/s":
        case "/sleep-interval":
            opts.interval = +get_next_arg(i);
            break;
        case "/retry":
            i++;
            opts.retry = true;
            break;
        case "/follow":
            i++;
            opts.follow = true;
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
function tail_skip(opts, stream) {
    var n = Math.abs(opts.n);
    var i;
    n = Math.max(n, stream.total)
    for (i = 0; i < n - 1; i++) {
        if(stream.stream.AtEndOfStream) { break; }
        stream.read();
    }
    while (!stream.stream.AtEndOfStream) {
        stdout.write(stream.read());
        i++;
    }
    stream.total += i;
}
function tail_last(opts, stream) {
    var n = Math.abs(opts.n);
    var i = 0, index = 0, total;
    var buf = [];
    while (!stream.stream.AtEndOfStream) {
        buf[index] = stream.read();
        i++;
        index = i % n;
    }
    total = i;
    if (i <= n) {
        for (i = 0; i < total; i++) { stdout.write(buf[i]); }
    } else {
        i = index;
        do {
            stdout.write(buf[i]);
            i = ++i % n;
        } while (i !== index)
    }
    stream.total += total;
}
function tail(opts, files) {
    // def function
    function filepathOrStdIn(filepath) {
        if (fso.FileExists(filepath)) { return true };
        if (filepath === "-") { return true };
        return false;
    }
    // def class
    function StdOut() {}
    function SrcStream(filepath) {
        this.total = 0;
        if (filepath === "-") {
            this.name = "StdIn";
            this.stream = WScript.StdIn;
        } else {
            this.name = filepath;
            this.stream = fso.OpenTextFile(filepath);
        }
    }
    // ext prototype 
    StdOut.prototype.write = opts.line_mode ?
        function (line) {
            WScript.StdOut.WriteLine(line)
        } :
        function (ch) {
            WScript.StdOut.Write(ch);
        };
    SrcStream.prototype.read = opts.line_mode ? 
        function () {
            return this.stream.ReadLine();
        } :
        function () {
            return this.stream.Read(1);
        };
    
    var tail_exec = opts.n >= 0 ? 
        tail_skip: 
        tail_last;
    var fso = WScript.CreateObject("Scripting.FileSystemObject");
    this.stdout = new StdOut(); // global
    var streams;
    
    streams = files
            .filter(filepathOrStdIn)
            .map(function (path) { return new SrcStream(path)});
    streams.forEach(function (stream) {
        tail_exec(opts, stream);
    });
    streams.forEach(function (stream) {
        stream.stream.Close();
    });
    
    // unfollow stdin
    var following_streams = streams.filter(function (stream) {
        if (stream.name === "StdIn") { return false }
        else { return true; }
    });
    
    // follow
    while(opts.follow && streams.length > 0) {
        streams = following_streams
            .filter(function(stream){
                if (fso.FileExists(stream.name)){
                    stream.stream = fso.OpenTextFile(stream.name);
                    return true;
                }
                else {
                    return false
                }
            });
        streams.forEach(function (stream) {
            tail_exec(opts, stream);
        });
        streams.forEach(function (stream) {
            stream.stream.Close();
        });
        WScript.Sleep(opts.interval);
    }
}

// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisp */) {
        if (this == null) error();
        var t = Object(this),
        len = t.length >>> 0;
        if (typeof fun != "function") error();
        var res = [],
        thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in t) {
            var val = t[i];
            if (fun.call(thisp, val, i, t)) res.push(val);
            }
        }
        return res;
    };
}

// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function( callback, thisArg ) {
        var T, k;
        if (this === null) {
            error(" this is null or not defined");
        }
        var O = Object(this);
        var len = O.length >>> 0; // Hack to convert O.length to a UInt32
        if ({}.toString.call(callback) !== "[object Function]") {
            error( callback + " is not a function" );
        }
        if ( thisArg ) { T = thisArg; }
        k = 0;
        while( k < len ) {
            var kValue;
            if ( k in O ) {
            kValue = O[ k ];
            callback.call( T, kValue, k, O );
        }
        k++;
        }
    };
}

// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function(callback, thisArg) {
        var T, A, k;
        if (this == null) {
            error(' this is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== 'function') {
            error(callback + ' is not a function');
        }
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

var args, opts, files;
args = parse_arguments();
opts = args.opts;
files = args.files;

if (files.length === 0) { files.push("-"); }
opts.total = 0; // total readline or readchar.

tail(opts, files);
