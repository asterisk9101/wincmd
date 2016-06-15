// [Usage]
// 名前
//     xl2csv - エクセルファイルを CSV に変換する
// 
// 文法
//     xl2csv [option]... FILE
//     xl2csv [/?] [/help] [/v] [/version]
// 
// 説明
//     xl2csv はバックグラウンドでエクセルを起動し、エクセルの機能を使ってファイルを CSV に変換する。
//     対象となるシートが指定されない場合、全てのシートを対象とする。
//     出力先が指定されない場合、CSV テキストを標準出力に流す。
// 
// OPTION
//     /o OUTFILE, /outfile OUTFILE
//         出力先 OUTFILE を指定します。
//         以下のマクロが使用でき、それぞれ右辺の文字列に置換されます。
// 
//         <book> = ブック名
//         <sheet> = シート名
//         <index> = シートのインデックス
//         <@> = <book>_<sheet>.csv
// 
//         例えば、hoge, fuga という 2 つのシートを持つエクセルブック piyo.xls に
//         対して以下のようにコマンドを実行した場合：
// 
//         xl2csv /o "C:\temp\<book>_<sheet>.csv" piyo.xls
// 
//         以下の 2 つのファイルが作成されます。
// 
//         C:\temp\piyo_hoge.csv
//         C:\temp\piyo_fuga.csv
// 
//     /s ADDRESS, /sheet ADDRESS
//         対象とするシートを ADDRESS で指定します。既定値は * （全てのシート）です。
//         ADDRESS として以下の値が使用できます。
// 
//         アスタリスク（全てのシート）
//         1 以上の数値（左端から数えたシートのインデックス）
//         シングルクォートに囲まれた名前（シートの名前）
//         ドル記号（右端のシート）
// 
//         また、ADDRESS はハイフンを含むことで範囲指定することができ、
//         カンマを含むことで複数指定(OR演算)することができます。
//         例えば、hoge, fuga, piyo, moge という 4 つのシートを持つエクセルブック HOGE.xls に
//         対して以下のようにコマンドを実行した場合：
// 
//         xl2csv /s 1-2,'moge' /o "C:\temp\<*>" HOGE.xls
// 
//         以下のファイルが出力されます。
// 
//         C:\temp\HOGE_hoge.csv
//         C:\temp\HOGE_fuga.csv
//         C:\temp\HOGE_moge.csv
// 
//     /p PASSWORD, /password PASSWORD
//         エクセルを開くためのパスワード PASSWORD を指定します。
// 
//     /h, /hidden
//         エクセルを非表示で実行します。
//         後述の既知の不具合などでコマンドが停止したとき、バックグラウンドにエクセルのプロセスが残るので注意してください。
// 
//     /?, /help
//         ヘルプを表示して正常終了します。
// 
//     /v, /version
//         バージョン情報を出力して正常終了します。
// 
// 一般的な xl2csv コマンドとの差異
//     一般的な xl2csv コマンドは存在しません。
//     csvkit(https://csvkit.readthedocs.io/) の in2csv に相当します。
// 
// 既知の不具合
//     outfile が既に存在する場合などにエラーで停止します。
// 

// [Version]
// xl2csv.js version 0.1

var prog_name = "xl2csv";

function error(m) {
    WScript.StdErr.WriteLine(prog_name + ": " + m);
    WScript.Quit(1);
}
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
function get_arg(index) {
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
        case "s": index++; opts.sheet = get_arg(index); break;
        case "o": index++; opts.outfile = get_arg(index); break;
        case "p": index++; opts.passwd = get_arg(index); break;
        case "h": opts.hidden = true; break;
        case "?": view("Usage"); WScript.Quit(0);
        default: error("invalid argument: " + arg);;
        }
    }
    return index;
}
function parse_arguments() {
    var i, len, arg, opts = {}, files = [];
    i = 0;
    len = WScript.Arguments.length;
    opts.index = 1;
    opts.sheet = "";
    opts.outfile = "-";
    opts.passwd = void 0;
    opts.wpasswd = void 0;
    for(; i < len; i++){
        arg = WScript.Arguments(i);
        if (arg === "--" || arg === "//") { i++; break; }
        switch(arg) {
        case "/": error("invalid argument: '/'");
        case "/sheet": i++; opts.sheet = get_arg(i); break;
        case "/outfile": i++; opts.outfile = get_arg(i); break;
        case "/hidden": opts.hidden = true; break;
        case "/password": i++; opts.passwd = get_arg(i); break; 
        case "/help": view("Usage"); WScript.Quit(0);
        case "/version": view("Version"); WScript.Quit(0);
        default: i = get_opt(i, opts, files); break;
        }
    }
    for(; i < len; i++){
        arg = WScript.Arguments(i);
        files.push(arg);
    }
    if (files.length === 0) { error('missing source excel file.'); }
    return {opts: opts, files: files };
}
function xl2csv (opts, file) {
    function range_addr(addr1, addr2) {
        this.addr1 = addr1;
        this.addr2 = addr2;
        this.state = "UNMATCH";
    }
    range_addr.prototype = {
        type: "RANGE_ADDRESS",
        match: function (sheet_state) {
            var ret;
            switch (this.state) {
            case "UNMATCH":
                ret = this.addr1.match(sheet_state);
                if (ret) { this.state = "MATCH"; }
                break;
            case "MATCH":
                ret = true;
                if (this.addr2.match(sheet_state)) { this.state = "CLOSE"; }
                break;
            case "CLOSE":
                ret = false;
                break;
            default:
                error("");
            }
            return ret;
        },
        toString: function () {
            return "(" + this.type + " " + this.addr1.toString() + " " + this.addr2.toString() + ")";
        }
    };
    function index_addr(index) {
        this.index = index;
    }
    index_addr.prototype = {
        type: "INDEX_ADDRESS",
        match: function (sheet_state) {
            return sheet_state.index === this.index;
        },
        toString: function () {
            return "(" + this.type + " " + this.index + ")";
        }
    }
    function not_addr(addr) {
        this.addr = addr;
    }
    not_addr.prototype = {
        type: "NOT_ADDRESS",
        match: function (sheet_state) {
            return !this.addr.match(sheet_state);
        },
        toString: function () {
            return "(" + this.type + " " + this.addr.toString() + ")";
        }
    };
    function tail_addr() {
        this.value = "$";
    }
    tail_addr.prototype = {
        type: "TAIL_ADDRESS",
        match: function (sheet_state) {
            return sheet_state.index === sheet.state.count;
        },
        toString: function () {
            return "(" + this.type + " " + this.value + ")";
        }
    };
    function regex_addr(re) {
        this.re = re;
    }
    regex_addr.prototype = {
        type: "REGEX_ADDRESS",
        match: function (sheet_state) {
            return this.re.test(sheet_state.name);
        },
        toString: function () {
            return "(" + this.type + " " + this.re.source + ")";
        }
    };
    function all_addr() {
    }
    all_addr.prototype = {
        type: "ALL_ADDRESS",
        match: function (sheet_state) {
            return true;
        },
        toString: function () {
            return "(" + this.type + " " + "*" + ")"; 
        }
    };
    function parse(param) {
        function next() {
            at++;
            ch = param.charAt(at);
            return ch;
        }
        function number() {
            var ret = 0;
            while ("0" <= ch && ch <= "9") {
                ret = ret * 10 + (+ch);
                next();
            }
            return ret;
        }
        function pattern() {
            var buf = [];
            while (next() !== "'") {
                if (ch === "") { error("invalid pattern."); }
                buf.push(ch);
            }
            return new RegExp(buf.join(""), "i");
        }
        function address() {
            var addr, tmp;
            if ("0" <= ch && ch <= "9") {
                addr = new index_addr(number());
            } else if (ch === "'") {
                addr = new regex_addr(pattern());
            } else if (ch === "$") {
                addr = new tail_addr();
                next();
            } else {
                error("?");
            }
            if (ch === "-") {
                next();
                if ("0" <= ch && ch <= "9") {
                    tmp = new index_addr(number());
                } else if (ch === "'") {
                    tmp = new regex_addr(pattern());
                } else if (ch === "$") {
                    tmp = new tail_addr();
                    next();
                } else {
                    error("?");
                }
                addr = new range_addr(addr, tmp);
            }
            if (ch === "!") {
                addr = new not_addr(addr);
                next();
            }
            return addr;
        }
        var at, ch, checklist = [];
        if (param === "*") { return [new all_addr()]; }
        at = 0;
        ch = param.charAt(at);
        while (ch !== "") {
            checklist.push(address());
            if (ch !== ",") { break;}
            next();
        }
        return checklist;
    }
    function parse_outpath(outfile, sheet_state) {
        var outpath = outfile;
        outpath = outpath.replace("<@>", sheet_state.bookName + "_" + sheet_state.name + ".csv");
        outpath = outpath.replace("<sheet>", sheet_state.name);
        outpath = outpath.replace("<book>", sheet_state.bookName);
        outpath = outpath.replace("<index>", sheet_state.index);
        outpath = fso.GetAbsolutePathName(outpath);
        return outpath;
    }
    var fso = WScript.CreateObject("Scripting.FileSystemObject");
    var ex = WScript.CreateObject("Excel.Application");
    var book, sheet, path, tempBook, tempPath;
    var checklist = parse(opts.sheet || "*");
    var i, len, sheet_state = {};
    ex.visible = !opts.hidden;
    book = ex.workbooks.open(
        file, // filename
        3, // UpdateLinks
        true, // ReadOnly
        2, // Format
        opts.passwd, // Password
        void 0, // WriteResPassword
        true // IgnoreReadOnlyRecommended
        );
    sheet_state.count = book.worksheets.count;
    sheet_state.bookName = fso.GetBaseName(book.name);
    for (i = 1, len = book.worksheets.count; i <= len; i++) {
        sheet_state.index = i;
        sheet = book.worksheets(i);
        sheet_state.name = sheet.name;
        if (checklist.some(function (matcher) { return matcher.match(sheet_state); })) {
            tempBook = ex.workbooks.add();
            sheet.copy(tempBook.worksheets(1));
            if (opts.outfile === "-") {
                path = fso.BuildPath(fso.GetSpecialFolder(2), fso.GetTempName());
                tempBook.saveAs(path, 6);
                tempBook.Close(false);
                stream = fso.OpenTextFile(path);
                while (!stream.AtEndOfStream) {
                    WScript.StdOut.WriteLine(stream.ReadLine());
                }
                stream.Close();
                fso.DeleteFile(path);
            } else {
                path = parse_outpath(opts.outfile, sheet_state);
                tempBook.saveAs(path, 6);
                WScript.StdOut.WriteLine(path);
                tempBook.close(false);
            }
        }
    }
    book.Close(false);
    ex.quit();
}
if (!Array.prototype.some) {
    Array.prototype.some = function(fun/*, thisArg*/) {
        if (this == null) {
            throw new Error('Array.prototype.some called on null or undefined');
        }
        if (typeof fun !== 'function') {
            throw new Error();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t && fun.call(thisArg, t[i], i, t)) {
                return true;
            }
        }
        return false;
    };
}
var args = parse_arguments();
xl2csv(args.opts, args.files);
