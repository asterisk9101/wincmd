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
//     アドレスの指定方法として 0,addr2 や addr1,+N や addr1,~N は使用できない。
// 
//     一部のコマンドは未実装(l, r, R)。
// 

// [Version]
// sed.js version 0.1

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
    function parser(text) {
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

    function vmachine(opt, list){
        var sed_state = {
            pattern: [],
            hold: [],
            line_num: 0,
            AtEndOfStream: false
        };
        
        var stat_head = list;
        var pc = null;
        var labels = {};
        
        var stream = null;
        var substitute_succeeded = false;
        var next_stack = [];
        var append_text = [];
        var fso = WScript.CreateObject("Scripting.FileSystemObject");
        
        function error(m) {
            WScript.StdErr.WriteLine("sed: runtime error: " + m);
            WScript.Quit(1);
        }
        function cmd_text(cmd){
            var text = cmd.args[0];
            
            switch(cmd.name){
            case "a":
                append_text.push(text);
                break;
            case "c":
                WScript.StdOut.Write(text + stream.br);
                sed_state.pattern = [];
                break;
            case "i":
                WScript.StdOut.Write(text + stream.br);
                break;
            }
        }
        function cmd_print(cmd){
            var text;
            if (sed_state.pattern.length === 0) { return; }
            
            switch(cmd.name){
            case "p": text = sed_state.pattern.join(stream.br); break;
            case "P": text = sed_state.pattern[0]; break;
            }
            WScript.StdOut.Write(text + stream.br);
        }
        function cmd_next(cmd){
            var line;
            if (stream.AtEndOfStream){ return ; }
            switch(cmd.name){
            case "n":
                sed_state.pattern = [stream.ReadLine()];
                break;
            case "N":
                sed_state.pattern.push(stream.ReadLine());
                break;
            }
            sed_state.line_num += 1;
            sed_state.AtEndOfStream = stream.AtEndOfStream;
        }
        function cmd_quit(cmd){
            if(cmd.name === "q"){
                WScript.StdOut.Write(sed_state.pattern.join(stream.br) + stream.br);
            }
            if (cmd.args.length === 0) {
                WScript.Quit(0);
            } else {
                WScript.Quit(cmd.args[0]);
            }
        }
        function cmd_write(cmd){
            var path = cmd.args[0];
            var file = fso.OpenTextFile(path, 2, true);
            var line;
            switch(cmd.name){
            case "w":
                line = sed_state.pattern.join(stream.br);
                break;
            case "W":
                line = sed_state.pattern[0];
                break;
            }
            file.Write(line + stream.br);
            file.Close();
        }
        function cmd_branch(cmd) {
            var bool, label;
            switch(cmd.name){
            case "b": bool = true; break;
            case "t": bool = substitute_succeeded; break;
            case "T": bool = !substitute_succeeded; break;
            }
            
            label = cmd.args[0];
            if (bool) {
                next_stack = [];
                pc = label ? labels[label] : null ;
            }
        }
        function cmd_substitute(cmd) {
            var regexp, replacement, flags, path;
            var file;
            regexp = cmd.args[0];
            replacement = cmd.args[1];
            flags = cmd.args[2];
            path = cmd.args[3];
            
            var text = sed_state.pattern.join(stream.br);
            
            // JScript bug?
            // restruct regexp instance.
            /*
            var flag = "";
            if (regexp.ignoreCase) { flag += "i"; }
            if (regexp.global) { flag += "g"; }
            if (regexp.multiline) { flag += "m"; }
            regexp = new RegExp(regexp.source, flag);
            */
            regexp.test("\0"); // dry run for JScript bug...
            if(regexp.test(text)){
                substitute_succeeded = true;
                text = text.replace(regexp, replacement);
                if (flags.indexOf("w") > -1) {
                    file = fso.OpenTextFile(path, 8, true);
                    file.Write(text + stream.br);
                    file.Close();
                }
                if (flags.indexOf("p") > -1) {
                    WScript.StdOut.Write(text + stream.br);
                }
                sed_state.pattern = text.split(stream.br);
            } else {
                substitute_succeeded = false;
            }
        }
        function cmd_y(cmd) {
            var i, len, src, dest, text;
            src = cmd.args[0];
            dest = cmd.args[1];
            
            text = sed_state.pattern.join(stream.br);
            for(i = 0, len = src.length; i < len; i++) {
                text = text.replace(new RegExp(src.charAt(i), "g"), dest.charAt(i));
            }
            sed_state.pattern = text.split(stream.br);
        }
        function exec(stat) {
            var cmd = stat.cmd, tmp;
            switch(cmd.name) {
            case "#": 
            case ":": break;
            case "=": WScript.StdOut.WriteLine(sed_state.line_num); break;
            case "GROUP":
                next_stack.push(pc.next);
                pc = { next: pc.cmd.args[0] || next_stack.pop() };
                break;
            case "D": 
                if (sed_state.pattern.length) { sed_state.pattern.shift(); }
                next_stack = [];
                pc = null; // interruption current cycle, and start next cycle
                break; 
            case "d":
                sed_state.pattern = [];
                next_stack = [];
                pc = null; // interruption current cycle, and start next cycle
                break;
            case "h": sed_state.hold = sed_state.pattern; break;
            case "H": sed_state.hold.push(sed_state.pattern.join(stream.br)); break;
            case "g": sed_state.pattern = sed_state.hold; break;
            case "G": sed_state.pattern.push(sed_state.hold.join(stream.br)); break;
            case "n": cmd_next(cmd); break;
            case "N": cmd_next(cmd); break;
            case "p": cmd_print(cmd); break;
            case "P": cmd_print(cmd); break;
            case "x": 
                tmp = sed_state.pattern;
                sed_state.pattern = sed_state.hold;
                sed_state.hold = tmp;
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
        function match(addr){
            return addr.match(sed_state);
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
        function flush_pattern_space() {
            if (!opt.n && sed_state.pattern.length) {
                WScript.StdOut.Write(sed_state.pattern.join(stream.br) + stream.br);
            }
        }
        function flush_append_text() {
            if (append_text.length !== 0) {
                WScript.StdOut.Write(append_text.join(stream.br) + stream.br);
                append_text = [];
            }
        }
        function run(strm) {
            var str;
            stream = strm;
            cycle: while(!stream.AtEndOfStream){
                sed_state.pattern = [stream.ReadLine()];
                sed_state.line_num += 1;
                sed_state.AtEndOfStream = stream.AtEndOfStream;
                pc = stat_head;
                while(pc){
                    if(match(pc.addr)){
                        exec(pc);
                    }
                    pc = next();
                }
                flush_pattern_space();
                flush_append_text();
            }
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

        // collect pointer to labels
        scan(stat_head, function (item) { if(item.cmd.name === ":") {
            labels[item.cmd.args[0]] = item;
        }});
        
        // init pc
        pc = stat_head;
        
        return {
            run: run
        }
    }

    var files = files_stream(inputs, opts.br);
    /* test files_stream
    while(!files.AtEndOfStream){
        WScript.StdOut.WriteLine(files.ReadLine());
        //WScript.StdOut.Write(files.Read(1));
    }
    */
    
    var list, item, vm;
    list = parser(scripts.join(opts.br));
    if (opts.debug) {
        for (item = list; item; item = item.next) {
            echo(item.toString());
        }
    } else {
        vm = vmachine(opts, list);
        vm.run(files);
    }
}
function files_stream (paths, br_pattern) {
    // 複数のファイルパスを受け取り、それららの内容を連続したストリームとして出力する。
    // 第一引数 paths として、ファイルパスの配列 (Array<String>) を受け取る。
    // 第二引数 br_pattern として、ファイルの改行コード (String) を受け取る。
    // 戻り値として、files_stream(Object) を返す。
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
function break_code(text) {
    // 改行コードをパースする
    var buf = [], i, len, ch;
    if (text.length === 0) { error("invalid break code."); }
    for(i = 0, len = text.length; i < len; i++){
        ch = text.charAt(i);
        if (ch === "\\") {
            i++;
            if (i >= text.length) { error("invalid break code."); }
            ch = text.charAt(i);
            switch(ch){
            case "n": buf.push("\n"); break;
            case "r": buf.push("\r"); break;
            default: error("unknown break code.");
            }
        } else {
            buf.push(ch);
        }
    }
    return buf.join("");
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

// for debug
// opts.n = true;
// scripts = ["1,$p"];
// inputs = ["test.txt"];

if (scripts.length === 0) {
    view("Usage");
    WScript.Quit(1);
}
if (inputs.length === 0) {
    inputs.push("-");
}

sed(opts, scripts, inputs);
