// [Usage]
// ���O
//     sed - �e�L�X�g�̃t�B���^�����O�A�ϊ��p�̃X�g���[���G�f�B�^  
// 
// ���@
//     sed [OPTION]... {script-only-if-no-other-script} [input-file]...
// 
// ����
//     sed �̓X�g���[���G�f�B�^�ł���B�X�g���[���G�f�B�^�́A���̓X�g���[�� (�t�@�C���܂��̓p�C�v���C������̓���) �ɑ΂���
//     ��{�I�ȃe�L�X�g�ϊ����s�����߂ɗp������Bsed �� �ҏW�X�N���v�g���g���� (ed �̂悤��) �G�f�B�^�� ���낢��ȖʂŎ��Ă��邪�A
//     sed �͓��͂ɑ΂��� 1 �p�X�����œ��삷��̂ŁA�������I�ł���B
//     �܂� sed �̓p�C�v���C���̃e�L�X�g�ɑ΂��ăt�B���^������s�����Ƃ��ł��A���̓_�͑��̃^�C�v�̃G�f�B�^�Ƃ͂�����Ⴄ�B
// 
// OPTION
//     /n, /quiet, /silent
//         �p�^�[���X�y�[�X�̎����o�͂�}������B
// 
//     /e script, /expression script
//         ���s����R�}���h�Ƃ��� script ��ǉ�����B
// 
//     /f script-file, /file script-file
//         ���s����R�}���h�Ƃ��� script-file �̓��e��ǉ�����B
// 
//     /b, /break
//         ���s�R�[�h���w�肷��(\r, \n, \r\n)�B
// 
//     /?, /help
//         �w���v��\�����ďI������
// 
//     /v, /version
//         �o�[�W���������o�͂��ďI������
// 
// 
// ��ʓI�� sed �Ƃ̍���
//     Windows ���s�R�[�h(\r\n)�𗘗p�ł���B
// 
//     s �R�}���h�̈����� /regexp/replacement/ �Ƃ���Ƃ��Aregexp �� JScript �̐��K�\�������ɏ�������B
//     �܂��Areplacement �ɂđO���Q�Ƃ���Ƃ��� $ �L�����g�p����(ex. $&, $1, $2...)�B
// 
//     �R���p�C���ςݐ��K�\�����ė��p���邱�Ƃ͂ł��Ȃ��B
// 
//     �A�h���X�̎w����@�Ƃ��� 0,addr2 �� addr1,+N �� addr1,~N �͎g�p�ł��Ȃ��B
// 
//     �ꕔ�̃R�}���h�͖�����(l, r, R)�B
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
        throw new Error("sed: arguments error");
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
                if (this.addr2.match(sed_state)) { this.state = "CLOSE"; }
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
    function StepAddress(addr, step) {
        this.addr = addr; // number, regex
        this.step = step; // number
        this.match_line = -1; // match line number
    }
    StepAddress.prototype = {
        type: "STEP_ADDRESS",
        match: function (sed_state) {
            var ret;
            if (this.match_line === -1) {
                if (this.addr.match(sed_state)) {
                    this.match_line = sed_state.line_num;
                    ret = true;
                } else {
                    ret = false
                }
            } else {
                if ((sed_state.line_num - this.match_line) % this.step) {
                    ret = false;
                } else {
                    ret = true;
                }
            }
            return ret;
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
            return "(" + this.type + " " + this.re.toString() + ")";
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
            var buf = [], i, len;
            buf.push("(" + this.name);
            for(i = 0, len = this.args.length; i < len; i++) {
                buf.push(" ");
                buf.push(this.args.toString());
            }
            buf.push(")");
            return buf.join("");
        }
    };
    function parser(text) {
        var at, ch;
        
        function error(m) {
            WScript.StdErr.WriteLine("sed: parse error: " + m + " at " + at + " '" + ch + "'");
            throw new Error(12345, "sed", m);
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
            if (ch === "~") {
                next();
                white();
                addr = new StepAddress(addr, number());
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
                break;
            case "}":
                if (addr.type !== "BLANK_ADDRESS") { error("doesn't want any address"); }
                break;
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
                white();
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
                white();
                tmp = string_line();
                if(!tmp) { error("missing label"); }
                args.push(tmp);
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
                    error("");
                }
                break;
            default:
                error("unknown command.");
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
                    buf.push(escape_break());
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
                if (ch === "\r" || ch === "\n" || ch === ";" || ch === "}") { break; }
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
                    buf.push(escape_break());
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
                    case delim: buf.push(delim); break;
                    default: buf.push(" "); break;
                    }
                } else {
                    buf.push(ch);
                }
                next();
            }
            return new RegExp(buf.join(""));
        }
        function escape_break() {
            var buf = [];
            if (ch === "\\") {
                buf.push("\\");
                next();
            } else if (ch === "\r") {
                buf.push(ch);
                next();
                if (ch === "\n") {
                    buf.push(ch);
                    next();
                }
            } else if (ch === "\n") {
                buf.push(ch);
                next();
            }
            return buf.join("");
        }
        function is_number(c) {
            return "0" <= c && c <= "9";
        }
        
        var list_head, list_item, skip = /[ \n\t;]/;
        at = 0;
        ch = text.charAt(at);
        
        list_head = statement();
        list_item = list_head;
        while(list_item.cmd.name !== "") {
            list_item.next = statement();
            list_item = list_item.next;
        }
        return list_head;
    }
    
    function vmachine(opt, list){
        var sed_state = {
            pattern: "",
            hold: "",
            line_num: 0,
            AtEndOfStream: false
        };
        
        var stat_head = list;
        var stat_tail = null;
        var pc = null;
        var labels = {};
        
        var stream = null;
        var success = false;
        var addr_stack = [];
        var append_text = [];
        var fso = WScript.CreateObject("Scripting.FileSystemObject");
        
        function error(m) {
            WScript.StdErr.WriteLine("sed: runtime error: " + m);
            throw new Error();
        }
        function cmd_text(cmd){
            var text = cmd.args[0];
            
            switch(cmd.name){
            case "a":
                append_text.push(text);
                break;
            case "c":
                WScript.StdOut.Write(text + stream.br);
                sed_state.pattern = "";
                break;
            case "i":
                WScript.StdOut.Write(text + stream.br);
                break;
            }
        }
        function cmd_print(cmd){
            var text;
            switch(cmd.name){
            case "p": text = sed_state.pattern; break;
            case "P": text = sed_state.pattern.slice(0, pattern.indexOf(stream.br)); break;
            }
            WScript.StdOut.Write(text + stream.br);
        }
        function cmd_next(cmd){
            var line;
            switch(cmd.name){
            case "n":
                sed_state.pattern = stream.ReadLine();
                break;
            case "N":
                sed_state.pattern = sed_state.pattern + stream.br + stream.ReadLine();
                break;
            }
            sed_state.line_num += 1;
            sed_state.AtEndOfStream = stream.AtEndOfStream;
        }
        function cmd_quit(cmd){
            if(cmd.name === "q"){
                WScript.StdOut.Write(sed_state.pattern + stream.br);
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
                line = sed_state.pattern;
                break;
            case "W":
                line = sed_state.pattern.split(stream.br)[0];
                break;
            }
            file.Write(line + stream.br);
            file.Close();
        }
        function cmd_branch(cmd) {
            var bool, label;
            switch(cmd.name){
            case "b": bool = true; break;
            case "t": bool = success; break;
            case "T": bool = !success; break;
            }
            
            // ���x�����͏ȗ��\
            // �ȗ������ꍇ�̓R�}���h��̖�����
            if (cmd.args.length > 1) {
                label = cmd.args[0];
            }
            
            addr_stack = [];
            if (bool) {
                pc = label ? labels[label] : stat_tail;
            }
            if (!pc) {
                error("missing branch");
            }
        }
        function cmd_substitute(cmd) {
            var regexp, replacement, flags, path;
            var file;
            regexp = cmd.args[0];
            replacement = cmd.args[1];
            flags = cmd.args[2];
            path = cmd.args[3];
            
            if(regexp.test(sed_state.pattern)){
                sed_state.pattern = sed_state.pattern.replace(regexp, replacement);
                success = true;
                if (flags.indexOf("w") > -1) {
                    file = fso.OpenTextFile(path, 2, true);
                    file.WriteLine(sed_state.pattern);
                    file.Close();
                }
                if (flags.indexOf("p") > -1) {
                    WScript.StdOut.Write(sed_state.pattern + stream.br);
                }
            }
        }
        function cmd_y(cmd) {
            var i, len, src, dest, pattern;
            src = cmd.args[0];
            dest = cmd.args[1];
            
            pattern = sed_state.pattern;
            for(i = 0, len = src.length; i < len; i++) {
                pattern = pattern.replace(new RegExp(src.charAt(i), "g"), dest.charAt(i));
            }
            sed_state.pattern = pattern;
        }
        function command(stat) {
            var cmd = stat.cmd, tmp;
            switch(cmd.name) {
            case "#": 
            case ":": break;
            case "}": 
                //echo("pop")
                addr_stack.pop();
                break;
            case "{": 
                //echo("push")
                addr_stack.push(stat.addr);
                break;
            case "=": WScript.StdOut.WriteLine(sed_state.line_num); break;
            case "d": 
                sed_state.pattern = ""; 
                pc = stat_tail;
                break;
            case "D": 
                if (sed_state.indexOf(stream.br) > -1) {
                    sed_state.pattern = sed_state.pattern.slice(tmp + stream.br.length);
                    pc = stat_head;
                } else {
                    sed_state.pattern = "";
                    pc = stat_tail;
                }
                break;
            case "h": sed_state.hold = sed_state.pattern; break;
            case "H": sed_state.hold = sed_state.hold + stream.br + sed_state.pattern; break;
            case "g": sed_state.pattern = sed_state.hold; break;
            case "G": sed_state.pattern = sed_state.pattern + stream.br + sed_state.hold; break;
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
            var i, len, ret = true;
            for(i = 0, len = addr_stack.length; i < len; i++){
                if (!addr_stack[i].match(sed_state)) {
                    ret = false;
                    break;
                }
            }
            return ret && addr.match(sed_state);
        }
        function run(strm) {
            stream = strm;
            while(!stream.AtEndOfStream){
                sed_state.pattern = stream.ReadLine();
                sed_state.line_num += 1;
                sed_state.AtEndOfStream = stream.AtEndOfStream;
                pc = stat_head;
                while(pc && pc.cmd.name !== ""){
                    if(pc.cmd.name === "{" || match(pc.addr)){
                        command(pc);
                    }
                    pc = pc.next;
                }
                if(!opt.n && sed_state.pattern) {
                    WScript.StdOut.Write(sed_state.pattern + stream.br);
                }
                if (append_text) {
                    WScript.StdOut.Write(append_text.join(stream.br) + stream.br);
                    append_text = [];
                }
            }
        }
        /*
            ���Ƃł��
            parser �� ; �� aic �̏I�[�ɂ��Ȃ�
        */
        
        // init lables
        pc = stat_head;
        while(pc.cmd.name !== ""){
            if(pc.cmd.name === ":") {
                labels.push(pc);
            }
            pc = pc.next;
        }
        
        // init stat_tail
        stat_tail = pc;
        
        // init pc
        pc = stat_head;
        
        return {
            run: run
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
        var at = 0;
        var fso = WScript.CreateObject("Scripting.FileSystemObject");
        
        function next() {
            // ���݊J���Ă���t�@�C�����������A�������͏I�[�ɒB���Ă����ꍇ�A���̃t�@�C�����J���B
            if (file === null || file.AtEndOfStream) {
                try {
                    if (file) { file.Close(); }
                    file = paths[at] === "-" ? WScript.StdIn : fso.OpenTextFile(paths[at]);
                } catch(e) {
                    WScript.StdErr.WriteLine("sed: file open fail. " + paths[at]);
                }
                at++;
            }
        }
        function Read(n) {
            // ���݊J���Ă���t�@�C������ n �����ǂݎ��B
            // ������ n �Ƃ��āA�t�@�C������ǂݎ�镶���� (Number) ���󂯎��B
            // �߂�l�Ƃ��āA�ǂݎ���������� (String) ��Ԃ��B
            var str;
            if (this.AtEndOfStream) { return ""; }
            next();
            
            str = file.Read(n);
            
            if (at === paths.length &&  file.AtEndOfStream) { this.AtEndOfStream = true; }
            return str;
        }
        function ReadLine() {
            // ���݊J���Ă���t�@�C������ 1 �s�ǂݎ��B
            // �߂�l�Ƃ��āA�ǂݎ���������� (String) ��Ԃ��B
            if (this.AtEndOfStream) { return ""; }
            next();
            var buf = [], ch, line;
            
            switch (this.br) {
            case "\r\n":
                line = file.ReadLine();
                break;
            case "\n":
            case "\r":
                ch = file.Read(1);
                while(ch !== this.br && !file.AtEndOfStream){
                    buf.push(ch);
                    ch = file.Read(1);
                }
                line = buf.join("");
                break;
            default:
                throw new Error();
            }
            if (at === paths.length &&  file.AtEndOfStream) { this.AtEndOfStream = true; }
            return line;
        }
        return {
            AtEndOfStream: AtEndOfStream, 
            br: br, 
            Read: Read, 
            ReadLine: ReadLine
        };
    }
    var files = files_stream(inputs, opts.br);
    
    /* test files_stream
    while(!files.AtEndOfStream){
        WScript.StdOut.WriteLine(files.ReadLine());
        //WScript.StdOut.Write(files.Read(1));
    }
    */
    
    /*
        ���Ƃł��
        stream �͏�ɍs���� br �� eof ���m���Ă����B
        vmachine �� br ������ꍇ�� br ���o�͂��A������� br �͏o�͂��Ȃ��B
    */
    var list = parser(scripts.join("\r\n"));
    /* test parser
    var item = list;
    while(item.cmd.name !== "") {
        echo(item.toString());
        item = item.next;
    }
    */
    
    var vm = vmachine(opts, list);
    vm.run(files);
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
    case "/n":
    case "/quiet":
    case "/silent":
        opts.n = true;
        break;
    case "/b":
    case "/break":
        i++;
        arg = get_next_arg(i);
        opts.br = arg;
        break;
    case "/f":
    case "/file":
        i++;
        arg = get_next_arg(i);
        arg = fso.OpenTextFile(arg);
        scripts.push(arg.ReadAll());
        arg.Close();
        break;
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
        WScript.StdErr("");
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
