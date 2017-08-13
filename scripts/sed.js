// [Usage]
// 名前
//     sed - テキストのフィルタリング、変換用のストリームエディタ  
// 
// 文法
//     sed [OPTION]... {script-only-if-no-other-script} [input-file]...
// 
// 説明
//     sed はストリームエディタである。ストリームエディタは、入力ストリーム (ファイルまたはパイプラインからの入力) に対して
//     基本的なテキスト変換を行うために用いられる。sed は 編集スクリプトを使える (ed のような) エディタと いろいろな面で似ているが、
//     sed は入力に対して 1 パスだけで動作するので、より効率的である。
//     また sed はパイプラインのテキストに対してフィルタ動作を行うことができ、この点は他のタイプのエディタとはっきり違う。
// 
// OPTION
//     /n, /quiet, /silent
//         パターンスペースの自動出力を抑制する。
// 
//     /e script, /expression script
//         実行するコマンドとして script を追加する。
// 
//     /f script-file, /file script-file
//         実行するコマンドとして script-file の内容を追加する。
// 
//     /b br, /break br
//         改行コードとして br を指定する。指定できる値は \r, \n, \r\n のいずれか。
//         既定値は \r\n (Windows 標準の改行コード)。
// 
//     /?, /help
//         ヘルプを表示して終了する
// 
//     /v, /version
//         バージョン情報を出力して終了する
// 
// 
// 一般的な sed との差異
//     Windows 改行コード(\r\n)を利用できる。
// 
//     s コマンドの引数を /regexp/replacement/ とするとき、regexp は JScript の正規表現実装に準拠する。
//     また、replacement にて前方参照するときは $ 記号を使用する(ex. $&, $1, $2...)。
// 
//     コンパイル済み正規表現を再利用することはできない。
// 
//     アドレスの指定方法として addr,+N や addr,~N は使用できない。
// 
//     一部のコマンドは未実装(l, r, R)。
// 

// [Version]
// sed.js version 0.3

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


function sed (opts, scripts, files) {
    function Statement(addr, cmd){
        this.next = null; // Statement
        this.addr = addr; // Address
        this.cmd = cmd; // Command
    }
    Statement.prototype = {
        type: "STATEMENT",
        toString: function () {
            return "(" + this.type + " " + this.addr.toString() + " " + this.cmd.toString() + ")";
        }
    };
    function RangeAddress(addr1, addr2) {
        this.addr1 = addr1; // NumberAddress, RegexAddress, StepAddress
        this.addr2 = addr2; // NumberAddress, RegexAddress
        this.state = "UNMATCH";
    }
    RangeAddress.prototype = {
        type: "RANGE_ADDRESS", 
        match: function (sed_state) {
            var ret;
            switch (this.state) {
            case "UNMATCH":
                ret = this.addr1.match(sed_state);
                if (ret) { this.state = "MATCH"; }
                break;
            case "MATCH":
                ret = true;
                if (this.addr2.match(sed_state)) { this.state = "UNMATCH"; }
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
    function StepAddress(addr, step) {
        this.first = addr.num; // number
        this.step = step; // number
    }
    StepAddress.prototype = {
        type: "STEP_ADDRESS",
        match: function (sed_state) {
            return sed_state.line_num % this.step === this.first
        },
        toString: function () {
            return "(" + this.type + " " + this.addr.toString() + " " + this.step + ")";
        }
    };
    function NumberAddress(num) {
        this.num = num; // number
    }
    NumberAddress.prototype = {
        type: "NUMBER_ADDRESS",
        match: function (sed_state) {
            return sed_state.line_num === this.num;
        },
        toString: function () {
            return "(" + this.type + " " + this.num + ")";
        }
    }
    function RegexAddress(re) {
        this.re = re; // regex
    }
    RegexAddress.prototype = {
        type: "REGEX_ADDRESS",
        match: function (sed_state) {
            return this.re.test(sed_state.pattern);
        },
        toString: function () {
            return "(" + this.type + " " + this.re.source + ")";
        }
    };
    function TailAddress() {
        this.value = "$";
    }
    TailAddress.prototype = {
        type: "TAIL_ADDRESS",
        match: function (sed_state) {
            return sed_state.AtEndOfStream;
        },
        toString: function () {
            return "(" + this.type + " " + this.value + ")";
        }
    };
    function NotAddress(addr) {
        this.addr = addr;
    }
    NotAddress.prototype = {
        type: "NOT_ADDRESS",
        match: function (sed_state) {
            return !this.addr.match(sed_state);
        },
        toString: function () {
            return "(" + this.type + " " + this.addr.toString() + ")";
        }
    };
    function BlankAddress() {
    }
    BlankAddress.prototype = {
        type: "BLANK_ADDRESS",
        match: function () {
            return true;
        },
        toString: function () {
            return "(" + this.type + ")";
        }
    };
    
    function Command(name, args) {
        this.name = name; // string
        this.args = args; // array
    }
    Command.prototype = {
        type: "COMMAND",
        toString: function () {
            var buf = [], i, len, item;
            buf.push("(" + this.name);
            if (this.name === "GROUP") {
                buf.push(" ");
                for(item = this.args[0]; item; item = item.next) {
                    buf.push(item.toString())
                }
            } else {
                for(i = 0, len = this.args.length; i < len; i++) {
                    buf.push(" ");
                    buf.push(this.args[i].toString());
                }
            }
            buf.push(")");
            return buf.join("");
        }
    };

    function vmachine (opts, scripts) {
        // private methods
        function error (m) {
            WScript.StdErr.WriteLine("sed: runtime error: " + m);
            WScript.Quit(1);
        }
        function echo (m) {
            WScript.StdOut.WriteLine(m);
        }
        function parse(text) {
            var at, ch;
            
            function error(m) {
                WScript.StdErr.WriteLine("sed: parse error: " + m + " at " + at);
                WScript.Quit(1);
            }
            function next() {
                at++;
                ch = text.charAt(at);
                return ch;
            }
            function white() {
                while(ch && ch <= " ") { next(); }
            }
            function space_break() {
                while(ch === " " || ch === "\t") { next(); }
                switch(ch){
                case "":
                case "\r":
                case "\n":
                case "}":
                    break;
                default:
                    error("require break.");
                }
            }
            function program() {
                var ret = statements();
                white();
                if(ch !== "") { error("unexpected `" + ch + "'"); }
                return ret;
            }
            function statements() {
                var list_head = statement();
                var list_item = list_head;
                white();
                while(ch !== "") {
                    if (ch === "}") { break }
                    list_item.next = statement();
                    list_item = list_item.next;
                    white();
                }
                return list_head;
            }
            function statement() {
                var addr, cmd, skip = /[ \n\r\t;]/;
                while(skip.test(ch)) { next(); }
                addr = address();
                white();
                cmd = command(addr);
                return new Statement(addr, cmd);
            }
            function address() {
                var addr, tmp;
                
                if (is_number(ch)) {
                    addr = new NumberAddress(number());
                    if (ch === "~") {
                        next();
                        addr = new StepAddress(addr, number());
                    }
                } else if (ch === "/") {
                    addr = new RegexAddress(regex(ch));
                    addr.re.ignoreCase = true;
                    next(); // skip delimiter
                } else if (ch === "\\") {
                    next();
                    addr = new RegexAddress(regex(ch));
                    next(); // skip delimiter
                } else if (ch === "$") {
                    addr = new TailAddress();
                    next();
                } else {
                    return new BlankAddress();
                }
                
                white();
                if (ch === ",") {
                    next();
                    white();
                    if (is_number(ch)) {
                        tmp = new NumberAddress(number());
                    } else if (ch === "/") {
                        tmp = new RegexAddress(regex(ch));
                        next(); // skip delimiter
                    } else if (ch === "\\") {
                        next();
                        tmp = new RegexAddress(regex(ch));
                        next(); // delimiter
                    } else if (ch === "$") {
                        tmp = new TailAddress();
                        next();
                    } else {
                        error("missing range end address");
                    }
                    addr = new RangeAddress(addr, tmp);
                }
                white();
                if (ch === "!") {
                    addr = new NotAddress(addr);
                    next();
                }
                
                return addr;
            }
            function command(addr) {
                var name, args = [], tmp;
                name = ch;
                next();
                switch(name) {
                case "":
                    // script end
                    if (addr.type !== "BLANK_ADDRESS") { error("missing command"); }
                    break;
                case "}":
                    error("unexpected `}'");
                case "#":
                    if (addr.type !== "BLANK_ADDRESS") { error("doesn't want any address"); }
                    white();
                    args.push(string_line());
                    break;
                case ":": 
                    if (addr.type !== "BLANK_ADDRESS") { error("doesn't want any address"); }
                    white();
                    args.push(string_line());
                    break;
                case "{": 
                    name = "GROUP"
                    args.push(statements());
                    white();
                    if(ch === "}") {
                        next();
                    } else {
                        error("unmatched `{'");
                    }
                    break;
                case "=": 
                case "d": 
                case "D": 
                case "h": 
                case "H": 
                case "g": 
                case "G": 
                case "n": 
                case "N": 
                case "p": 
                case "P": 
                case "x": 
                    while(/[ ;\t\r\n]/.test(ch)) { next(); }
                    break;
                case "q": 
                case "Q": 
                    tmp = number_opt();
                    if (tmp) { args.push(tmp); }
                    break;
                case "b": 
                case "t": 
                case "T": 
                    while(ch === " " || ch === "\t") { next(); }
                    args.push(string_line());
                    break;
                case "r": 
                case "R": 
                case "w": 
                case "W": 
                    white();
                    tmp = string_line();
                    if(!tmp) { error("missing files"); }
                    args.push(tmp);
                    break;
                case "a": 
                case "i": 
                case "c": 
                    white();
                    tmp = string();
                    if(!tmp) { error("missing string"); }
                    args.push(tmp);
                    break;
                case "l": 
                    while(/[ \t\r\n;]/.test(ch)) { next(); }
                    break;
                case "s": 
                    args.push(regex(ch));
                    args.push(replacement(ch));
                    next(); // skip delimiter
                    
                    tmp = flags();
                    args.push(tmp);
                    args[0] = new RegExp(args[0].source, tmp.replace(/[^igm]/g,""));
                    if (tmp.slice(-1) === "w") {
                        while(/[ \t]/.test(ch)) { next(); }
                        tmp = string_line();
                        if (!tmp) { error("file?"); }
                        args.push(tmp);
                    }
                    break;
                case "y": 
                    args.push(src(ch));
                    args.push(dest(ch));
                    next(); // skip delimiter
                    
                    // check length
                    if (args[0].length !== args[1].length) {
                        error("strings for 'y' command are different lengths.");
                    }
                    break;
                default:
                    error("unknown command: '" + name + "'");
                }
                return new Command(name, args);
            }
            function flags() {
                var flag = { "m": "", "g": "", "i": "", "p": ""};
                var flag_char = /[migp]/;
                
                while (flag_char.test(ch)) {
                    flag[ch] = flag[ch] ? error("predefined") : ch;
                    next();
                }
                if (ch === "w") {
                    flag[ch] = ch;
                    next();
                }
                return values(flag).join("");
            }
            function values(obj) {
                var iter, ary = [];
                for(iter in obj) {
                    ary.push(obj[iter]);
                }
                return ary;
            }
            function src(delim) {
                return quoted_string(delim);
            }
            function dest(delim) {
                return quoted_string(delim);
            }
            function replacement(delim) {
                return quoted_string(delim);
            }
            function quoted_string(delim) {
                var buf = [];
                
                if (ch === "") { error(""); }
                
                next(); // skip delimiter
                while(ch !== delim) {
                    if (ch === "" || ch === "\r" || ch === "\n") { error(""); }
                    if (ch === "\\") {
                        next();
                        buf.push(escape());
                    } else {
                        buf.push(ch);
                        next();
                    }
                }
                return buf.join("");
            }
            function string_line() {
                // string without break
                var buf = [];
                while(ch !== "") {
                    if (ch === "\r" || ch === "\n" || ch === "" || ch === ";") { break; }
                    buf.push(ch);
                    next();
                }
                return buf.join("");
            }
            function string() {
                // string with break
                var buf = [];
                while(ch !== "") {
                    if (ch === "\r" || ch === "\n") { break; }
                    if (ch === "\\") {
                        next();
                        buf.push(escape());
                    } else {
                        buf.push(ch);
                        next();
                    }
                }
                if (buf.length === 0) { error("not string"); }
                return buf.join("");
            }
            function number_opt() {
                var buf;
                while(ch === " " || ch === "\t") { next(); }
                if (ch === "" || ch === "\r" || ch === "\n" || ch === ";" || ch === "}") { return; }
                
                if (isNumber(ch)) {
                    buf = +ch;
                } else {
                    error("not number");
                }
                
                while (isNumber(ch)) {
                    buf = ch * 10 + (+ch);
                }
                return Node("NUMBER", buf);
            }
            function number() {
                var ret;
                if (!is_number(ch)) { error("not number"); }
                ret = +ch;
                next();
                while(ch !== "") {
                    if (!is_number(ch)) { break; }
                    ret = ret * 10 + (+ch);
                    next();
                }
                return ret;
            }
            function regex(delim) {
                var buf = [];
                next(); // skip delimiter
                while(ch !== delim){
                    if (ch === "") { error("not closed regex"); }
                    if (ch === "\\") {
                        switch(next()) {
                        case "t": buf.push("\t"); break;
                        case "n": buf.push("\n"); break;
                        case "r": buf.push("\r"); break;
                        case "\\": buf.push("\\\\"); break;
                        case delim: buf.push(delim); break;
                        default: buf.push("\\" + ch); break;
                        }
                    } else {
                        buf.push(ch);
                    }
                    next();
                }
                return new RegExp(buf.join(""));
            }
            function escape() {
                var buf = [];
                switch(ch) {
                case "\\":
                    buf.push(ch); next();
                    break;
                case "\r":
                    buf.push(ch); next();
                    if (ch === "\n") {
                        buf.push(ch);
                        next();
                    }
                    break;
                case "\n":
                    buf.push(ch); next();
                    break;
                case "t":
                    buf.push("\t"); next();
                    break;
                case "n":
                    buf.push("\n"); next();
                    break;
                case "r":
                    buf.push("\r"); next();
                    break;
                case "x":
                    buf.push(hex())
                    break;
                default: 
                    buf.push(ch); next();
                    break;
                }
                return buf.join("");
            }
            function hex() {
                var xffff = 0, i, hex;
                next();
                for (i = 0; i < 4; i++) {
                    hex = parseInt(ch, 16);
                    if (!isFinite(hex)) { break; }
                    xffff = (xffff * 16) + hex;
                    next();
                }
                return String.fromCharCode(xffff);
            }
            function is_number(c) {
                return "0" <= c && c <= "9";
            }
            
            at = 0;
            ch = text.charAt(at);
            
            return program();
        }
        function scan(item, func) {
            while(item) {
                if (item.cmd.name === "GROUP") {
                    scan(item.cmd.args[0], func);
                } else {
                    func(item);
                }
                item = item.next;
            }
        }

        // sed command (private methods)
        function cmd_text(cmd) {
            var text = cmd.args[0];
            switch (cmd.name) {
                case "i": insert_text.push(text); break;
                case "c": pattern = [text]; break;
                case "a": append_text.push(text); break;
            }
        }
        function cmd_print(cmd) {
            var text;
            if (pattern.length === 0) { return }
            switch (cmd.name) {
                case "p": text = pattern.join(br); break;
                case "P": text = pattern[0]; break;
            }
            echo(text);
        }
        function cmd_next(cmd) {
            var line;
            if (stream.AtEndOfStream) { return }
            switch (cmd.name) {
                case "n": pattern = [stream.ReadLine()]; break;
                case "N": pattern.push(stream.ReadLine()); break;
            }
            line_num += 1;
        }
        function cmd_quit(cmd) {
            if (cmd.name === "q") {
                echo(pattern.join(br));
            }
            if (cmd.args.length === 0) {
                WScript.Quit(0);
            } else {
                WScript.Quit(cmd.args[0]);
            }
        }
        function cmd_write(cmd) {
            var path = cmd.args[0];
            var file = fso.OpenTextFile(path, 2, true); // write, create
            var text;
            switch (cmd.name) {
                case "w": text = pattern.join(br); break;
                case "W": text = pattern[0]; break;
            }
            file.Write(line);
            file.Close();
        }
        function cmd_branch(cmd) {
            var bool, label;
            switch (cmd.name) {
                case "b": bool = true; break;
                case "t": bool = substitute_succeeded; break;
                case "T": bool = !substitute_succeeded; break;
            }
            label = cmd.args[0];
            if (bool) {
                next_stack = [];
                pc = label ? labels[label] : null;
            }
        }
        function cmd_substitute(cmd) {
            var file;
            var regexp = cmd.args[0];
            var replacement = cmd.args[1];
            var flags = cmd.args[2];
            var path = cmd.args[3];
            var text = pattern.join(br);
            regexp.test("\0");
            if (regexp.test(text)) {
                substitute_succeeded = true;
                text = text.replace(regexp, replacement);
                if (flags.indexOf("w") > -1) {
                    file = fso.OpenTextFile(path, 8, true); // append, create
                    file.Write(text);
                    file.Close();
                }
                if (flags.indexOf("p") > -1) {
                    echo(text);
                }
                pattern = text.split(br);
            } else {
                substitute_succeeded = false;
            }
        }
        function cmd_y(cmd) {
            var i, len;
            var src = cmd.args[0];
            var dest = cmd.args[1];
            var text = pattern.join(br);
            for (i = 0, len = src.length; i < len; i++) {
                text = text.replace(new RegExp(src.charAt(i), "g"), dest.charAt(i));
            }
            pattern = text.split(br);
        }

        // private methods
        function exec() {
            var cmd = pc.cmd, tmp;
            switch(cmd.name) {
            case "#": 
            case ":": break;
            case "=": echo(line_num); break;
            case "GROUP":
                next_stack.push(pc.next);
                pc = { next: pc.cmd.args[0] || next_stack.pop() };
                break;
            case "D": 
                if (pattern.length) { pattern.shift(); }
                next_stack = [];
                pc = null; // interruption current cycle, and start next cycle
                break; 
            case "d":
                pattern = [];
                next_stack = [];
                pc = null; // interruption current cycle, and start next cycle
                break;
            case "h": hold = pattern; break;
            case "H": hold.push(pattern.join(br)); break;
            case "g": pattern = hold; break;
            case "G": pattern.push(hold.join(br)); break;
            case "n": cmd_next(cmd); break;
            case "N": cmd_next(cmd); break;
            case "p": cmd_print(cmd); break;
            case "P": cmd_print(cmd); break;
            case "x": 
                tmp = pattern;
                pattern = hold;
                hold = tmp;
                break;
            case "q": cmd_quit(cmd); break;
            case "Q": cmd_quit(cmd); break;
            case "b": cmd_branch(cmd); break;
            case "t": cmd_branch(cmd); break;
            case "T": cmd_branch(cmd); break;
            case "w": cmd_write(cmd); break;
            case "W": cmd_write(cmd); break;
            case "a": cmd_text(cmd); break;
            case "i": cmd_text(cmd); break;
            case "c": cmd_text(cmd); break;
            case "s": cmd_substitute(cmd); break;
            case "y": cmd_y(cmd); break;
            case "l": 
            case "r": 
            case "R": 
                break;
            default:
                error("invalid command. '" + cmd.name + "'");
            }
        }
        function read() {
            if (stream.AtEndOfStream) { return }
            pattern = [stream.ReadLine()];
            line_num += 1;
            substitute_succeeded = false;
        }
        function next() {
            if (pc === null) { return null }
            if (pc.next) {
                pc = pc.next;
            } else if (next_stack.length) {
                pc = next_stack.pop();
            } else {
                pc = null;
            }
            return pc;
        }
        function match() {
            state.pattern = pattern;
            state.line_num = line_num;
            state.AtEndOfStream = stream.AtEndOfStream;
            return pc.addr.match(state);
        }
        function flush() {
            if (insert_text.length !== 0) {
                echo(insert_text.join(br));
                insert_text = [];
            }
            if (pattern.length !== 0 && !quiet) {
                echo(pattern.join(br));
            }
            if (append_text.length !== 0) {
                echo(append_text.join(br));
                append_text = [];
            }
        }

        // public method
        function run (strm) {
            stream = strm;
            while (!stream.AtEndOfStream) {
                pc = stat_head;
                read();
                while (pc) {
                    if (match()) {
                        exec()
                    }
                    next();
                }
                flush();
            }
        }

        var state = {};
        var br = opts.br;
        var quiet = opts.n;
        var pattern = [];
        var hold = [];
        var line_num = 0;
        var insert_text = [];
        var append_text = [];
        var labels = {};
        var substitute_succeeded = false;
        var fso = WScript.CreateObject("Scripting.FileSystemObject");
        var stat_head = parse(scripts);
        var next_stack = [];
        var pc = stat_head;

        if (opts.debug) {
            for (; pc; pc = pc.next) {
                echo(pc.toString());
            }
            WScript.Quit(0);
        }

        scan(stat_head, function (item) {
            if (item.cmd.name === ":") {
                labels[item.cmd.args[0]] = item;
            }
        });
        return { run: run }
    }
    var vm = vmachine(opts, scripts);
    var i, len, stream, path;
    for (i = 0, len = files.length; i < len; i++) {
        path = files[i];
        stream = path === "-" ? WScript.StdIn : fso.OpenTextFile(path);
        vm.run(stream);
        stream.Close();
    }
}

function break_code(text) {
    if (/\\r\\n/.test(text)) {
        return "\r\n"
    }
    if (/\\n/.test(text)) {
        return "\n"
    }
    error("invalid break code.");
}

// parse options
var fso = WScript.CreateObject("Scripting.FileSystemObject");
var arg, i, len, opts = {}, scripts = [], inputs = [];
opts.n = false;
opts.br = "\r\n";
for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg === "//") { break; }
    if (arg === "--") { break; }
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
    case "/debug":
        opts.debug = true;
        break;
    case "/b":
    case "/break":
        i++;
        arg = get_next_arg(i);
        opts.br = break_code(arg);
        break;
    case "/n":
    case "/quiet":
    case "/silent":
        opts.n = true;
        break;
    case "/nf":
        opts.n = true;
        // fall through
    case "/f":
    case "/file":
        i++;
        arg = get_next_arg(i);
        arg = fso.OpenTextFile(arg);
        scripts.push(arg.ReadAll());
        arg.Close();
        break;
    case "/ne":
        opts.n = true;
        // fall through
    case "/e":
    case "/expression":
        i++;
        arg = get_next_arg(i);
        scripts.push(arg);
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
        error("sed: invalid arguments. '" + arg + "'")
        break;
    }
}

if (scripts.length === 0) {
    i++;
    arg = get_next_arg(i);
    scripts.push(arg);
}

// parse arguments
for(; i < len; i++){
    arg = WScript.Arguments(i);
    if (fso.FileExists(arg)) {
        inputs.push(arg);
    } else if (arg === "-") {
        inputs.push("-");
    } else {
        error("file not found.");
    }
}

if (scripts.length === 0) {
    view("Usage");
    WScript.Quit(1);
}
if (inputs.length === 0) {
    inputs.push("-");
}

sed(opts, scripts.join(opts.br), inputs);
