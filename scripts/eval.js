// [Usage]
// 名前
//     eval - 式や関数を評価する。
// 
// 文法
//     eval [option]... EXPR...
//     eval [/?] [/help] [/v] [/version]
//     eval [/syntax] [/sample] [/function]
// 
// 説明
//     eval は EXPR を評価した結果を出力します。
//     結果が true(または数値、文字列など) の場合は、%ERRORLEVEL% に 0 を設定します。
//     結果が false (または null, NaN) の場合は、%ERRORLEVEL% に 1 を設定します。
//     式の評価自体に失敗した場合は、%ERRORLEVEL% に 2 以上の値を設定します。
// 
// OPTION
//     /i, /stdin
//         標準入力を eval の変数 $ にセットします。
// 
//     /f, /filter
//         /i オプションと組み合わせて使用します。
//         結果が TRUE になった場合だけ $ を出力します。
// 
//     /s, /silent
//         結果を出力しません。
// 
//     /F
//         eval をフィルタモードで実行します。/ifs を指定する場合と等価です。
// 
//     /syntax
//         EVAL コマンドの文法を表示して正常終了します。
// 
//     /sample
//         EXPR のサンプルを表示して正常終了します。
// 
//     /function
//         eval で使用できる関数の一覧を表示して正常終了します。
// 
//     /?, /help
//         ヘルプを表示して正常終了します。
// 
//     /v, /version
//         バージョン情報を出力して正常終了します。
// 
// 一般的な eval コマンドとの差異
//     一般的な eval コマンドは、引数を1つにまとめてコマンドとして実行しますが、
//     この eval コマンドは Linux における expr , test または find コマンドに相当します。
// 

// [Syntax]
// 数値
//     小数を表現できます。
//     eval 1.5
//     => 1.5
//
//     負数を表現できます。
//     eval -1
//     => -1
// 
//     単位(k, m, g)を付けることができます。
//     eval 1k
//     => 1000
// 
// 文字列
//     文字列はシングルクォートで括ります
//     eval 'sample string'
//     => sample string
// 
//     文字列の結合ができます。
//     eval 'abc' + 'def'
//     => abcdef
// 
//     文字列が \ 記号を含む場合はエスケープが必要です。
//     eval 'C:\\Windows\\'
//     => C:\Windows\
// 
//     先頭に @ を付与することでエスケープ文字を ` 記号に変更することができます。
//     eval @'C:\Windows\'
//     => C:\Windows\
// 
//     エスケープで表現できる文字は以下の通り。
//     n     改行
//     r     復帰
//     t     水平タブ
//     '     シングルクォート
//     \     エスケープ文字自身(@ している場合は `)
//     uFFFF 16進数2バイト文字(\u0022 のダブルクォートは頻繁に使うでしょう)
// 
// 真偽値
//     true と false の2種類です。大文字・小文字は区別されます。
// 
// NULL
//     null の 1 種類です。今のところ想定される使い方はありません。
// 
// 日付
//     日付は # で括ります。計算に使用できますが、
//     文字列の生成には向きません(mkdateコマンドを使ってください)。
// 
//     eval "#2016/5/8#"
//     => Sun May 8 00:00:00 UTC+0900 2016
// 
// 演算
//     演算子の優先順位を正しく評価できます。
//     eval 1 + 2 * 3
//     => 7
// 
//     eval (1 + 2) * 3
//     => 9
// 
//     多くの演算子はコマンドプロンプトに解釈されてしまうので
//     EXPR は基本的にダブルクォートで括ると良いでしょう。
// 
//         除算演算子は、コマンドへのオプションとなってしまうためクォートが必要です。
//         eval "10 / 7"
//         => 1.4285714285714286
// 
//         論理演算子は、コマンドプロンプトの式になってしまうためクォートが必要です。
//         eval "true && false"
//         => false
// 
//         eval "false || true"
//         => true
// 
//         比較演算子は、出力のリダイレクトになってしまうためクォートが必要です。
//         eval "100 > 10"
//         => true
// 
//     論理演算子は2種類(&, && または |, ||)ありますが、区別はありません。
//     また、両方ともショートサーキットです。
//     eval "file('abc.txt') & size('abc.txt') > 1k"
//     eval "file('abc.txt') && size('abc.txt') > 1k"
//     => true(or false) 同じ結果になる。
//                       また、'abc.txt' が存在しない場合 file() が false となるので、
//                       size() は評価されない。よって size() でエラーは発生しない。
// 
//     (関数の詳細については /function オプションを参照してください)
// 

// [Sample]
// 条件分岐の可読性を高める
//     eval コマンドの関数を使用することで可読性の高い条件分岐を記述することができます。
//     eval コマンドは式が true となるとき環境変数 %ERRORLEVEL% に 0 をセットします。
// 
//     :: 二つの条件を IF を入れ子にせず記述できる
//     eval "file(@'file.txt') && size(@'file.txt') > 1k"
//     IF %ERRORLEVEL% EQU 0 goto hogehoge
// 
//     :: OR 条件の複数条件にも対応できる
//     eval "file(@'file.txt') || dir(@'folder')"
//     IF %ERRORLEVEL% EQU 0 goto hogehoge
// 
//     :: 複雑な条件を複数行に分けて記述する場合(実行コストは高くなるでしょう)
//     eval "%ERRORLEVEL% == 0 && file(@'file.txt')"
//     eval "%ERRORLEVEL% == 0 && size(@'file.txt') > 1k"
//     eval "%ERRORLEVEL% == 0 && adate(@'file.txt') > #2016/05/10#"
//     eval "%ERRORLEVEL% == 0 && length(fullpath(@'file.txt')) <= 255"
//     IF %ERRORLEVEL% EQU 0 goto hogehoge
// 
// 数値計算
//     eval は複雑な数値計算にも対応できます(JScriptの計算精度に依存します)。
// 
//     eval "1 + 2 * 3 + (4 % 5) / pow(6, 7)"
//     => 7.0000142889803385
// 
//     計算結果の取得は、これまで通り FOR を使ってください。
// 
// フィルタ
//     eval は標準出力のフィルタとして利用できます。
// 
//     以下の例は、標準出力から読み込んだファイルとフォルダの一覧から
//     1000バイト以上のファイルだけを出力します。
//     $ は標準入力が代入される eval コマンド唯一の変数です。
//
//     dir /s /b | eval "file($) && size($) > 1k" /ifs
// 

// [Function]
// ファイルシステム
//     file(STRING)
//         STRING で指定されたファイルが存在する場合は true を返します。
// 
//     dir(STRING)
//         STRING で指定されたフォルダが存在する場合は true を返します。
// 
//     empty(STRING)
//         STRING で指定されたファイルまたはフォルダが空の場合に true を返します。
// 
//     size(STRING)
//         STRING で指定されたファイルのサイズを返します。
// 
//     cdate(STRING)
//         STRING で指定されたファイルの作成日時を返します。
// 
//     mdate(STRING)
//         STRING で指定されたファイルの更新日時を返します。
// 
//     adate(STRING)
//         STRING で指定されたファイルのアクセス日時を返します。
// 
// 文字列
//     length(STRING)
//         STRING で指定された文字列の長さを返します。
// 
//     to_n(STRING)
//         STRING を数値に変換します。
// 
//     slice(STRING, NUMBER1[, NUMBER2])
//         STRING を NUMBER1 文字目以降を切り出した STRING を返します。
//         NUMBER2 を指定すると、NUBMER1 から NUMBER2 文字目を切り出した STRING を返します。
// 
//     indexof(STRING1, STRING2)
//         STRING1 の中に STRING2 があるか検索します。
//         発見した位置(Number)を返します。
//         発見できなかった場合は -1 を返します。
// 
//     upper(STRING)
//         STRING を大文字にして返します。
// 
//     lower(STRING)
//         STRING を小文字にして返します。
// 
//     depth(STRING)
//         STRING をバックスラッシュ(円記号、\)で分割したとき、分割された要素の数を返す。
// 
// 数学
//     sqrt(NUMBER)
//         NUMBER の平方根を返します。
// 
//     pow(NUMBER1, NUMBER2)
//         NUMBER1 を NUMBER2 のべき乗で返します。
// 
//     round(NUMBER)
//         NUMBER を四捨五入した値を返します。
// 
//     floor(NUMBER)
//         NUMBER の小数部を切り捨てた値を返します。
// 
//     ceil(NUMBER)
//         NUMBER の小数部を切り上げた値を返します。
// 
//     sin(NUMBER)
//         NUMBER の sin 値を返します。NUMBER はラジアンです。
// 
//     cos(NUMBER)
//         NUMBER の cos 値を返します。NUMBER はラジアンです。
// 
//     tan(NUMBER)
//         NUMBER の tan 値を返します。NUMBER はラジアンです。
// 
// 日付
//     today()
//         システム日付を返します。
// 

// [Version]
// eval.js version 0.1

var prog_name = "eval";

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
            opts.stdin = true;
            opts.filter = true;
            opts.silent = true;
            break;
        case "i": opts.stdin = true; break;
        case "f": opts.filter = true; break;
        case "s": opts.silent = true; break;
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
    if (len === 0) { view("Usage"); WScript.Quit(2); }
    for(; i < len; i++){
        arg = WScript.Arguments(i);
        if (arg === "--" || arg === "//") { i++; break; }
        switch(arg) {
        case "/": error("invalid argument: '/'");
        case "/stdin": opts.stdin = true; break;
        case "/filter": opts.filter = true; break;
        case "/silent": opts.silent = true; break;
        case "/debug": opts.debug = true; break;
        case "/syntax": view("Syntax"); WScript.Quit(0);
        case "/sample": view("Sample"); WScript.Quit(0);
        case "/function": view("Function"); WScript.Quit(0);
        case "/help": view("Usage"); WScript.Quit(0);
        case "/version": view("Version"); WScript.Quit(0);
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
function evalate(opts, expr) {
    function Token(type, value) {
        this.type = type;
        this.value = value;
    }
    Token.prototype.toString = function () {
        return this.type + ":" + this.value;
    };
    function Lexer(expr) {
        var at, ch;
        function error(m) {
            throw new Error("Lexer: " + m + ": " + at);
        }
        function next(c) {
            if (c && ch !== c) { error("unexpected character"); }
            at++;
            ch = expr.charAt(at);
            return ch;
        }
        function white() {
            while (ch && ch <= " ") { next(); }
        }
        function hex() {
            var uffff = 0, hex, i;
            for(i = 0; i < 4; i++){
                hex = parseInt(ch, 16);
                if (!isFinite(hex)) { break; }
                uffff = uffff * 16 + hex;
                next();
            }
            return String.fromCharCode(uffff);
        }
        function string(esc) {
            var buf = [];
            esc = esc || "\\";
            next("'"); // skip quote
            while(ch !== "'"){
                if (ch === "") { error("invalid string"); }
                if (ch === esc) {
                    switch (next()){
                    case "n": next(); buf.push("\n"); break;
                    case "r": next(); buf.push("\r"); break;
                    case "t": next(); buf.push("\t"); break;
                    case "u": next(); buf.push(hex()); break;
                    case "'": next(); buf.push("'"); break;
                    case esc: next(); buf.push(esc); break;
                    default: error("invalid string:");
                    }
                } else {
                    buf.push(ch);
                    next();
                }
            }
            next("'"); // skip quote
            return new Token("STRING", buf.join(""));
        }
        function number() {
            var buf = [], num;
            while("0" <= ch && ch <= "9") {
                buf.push(ch);
                next();
            }
            if (ch === ".") {
                buf.push(ch);
                while(next() && "0" <= ch && ch <= "9"){
                    buf.push(ch);
                }
            }
            num = +buf.join("");
            switch(ch){
            case "k":
            case "K": next(); num = num * 1000; break;
            case "m":
            case "M": next(); num = num * 1000 * 1000; break;
            case "g":
            case "G": next(); num = num * 1000 * 1000 * 1000; break;
            }
            if (!isFinite(num)){
                error("invalid number " + buf.join(""));
            } else {
                return new Token("NUMBER", num);
            }
        }
        function word() {
            var re = /[a-zA-Z_$]/;
            var buf = [];
            while(re.test(ch)){
                buf.push(ch);
                next();
            }
            return new Token("WORD", buf.join(""));
        }
        function datetime() {
            var buf = [];
            next("#"); // skip hash
            while(ch !== "#") {
                if (ch === "") { break; }
                buf.push(ch);
                next();
            }
            next("#"); // skip hash
            var ret = new Date(buf.join(""));
            if (ret === ret) {
                return new Token("DATE", new Date(buf.join("")));
            } else {
                // ret is NaN
                error("invalid date. " + buf.join(""));
            }
        }
        function nextToken() {
            var token;
            white();
            switch(ch){
            case "": token = new Token("END", ""); break;
            case ",": next(); token = new Token("COM", ","); break;
            case "+": next(); token = new Token("ADD", "+"); break;
            case "-": next(); token = new Token("SUB", "-"); break;
            case "*": next(); token = new Token("MUL", "*"); break;
            case "/": next(); token = new Token("DIV", "/"); break;
            case "%": next(); token = new Token("MOD", "%"); break;
            case "(": next(); token = new Token("LPA", "("); break;
            case ")": next(); token = new Token("RPA", ")"); break;
            case "!":
                next();
                if (ch === "=") {
                    next();
                    token = new Token("NEQ", "!=");
                } else {
                    token = new Token("NOT", "!");
                }
                break;
            case "=":
                next();
                if (ch === "=") {
                    next();
                    token = new Token("EQL", "==");
                } else {
                    token = new Token("EQL", "=");
                }
                break;
            case ">": 
                next(); 
                if (ch === "=") {
                    next();
                    token = new Token("GTE", ">=");
                } else {
                    token = new Token("GT", ">"); 
                }
                break;
            case "<": 
                next(); 
                if (ch === "=") {
                    next();
                    token = new Token("LTE", "<=");
                } else {
                    token = new Token("LT", "<"); 
                }
                break;
            case "&":
                next();
                if (ch === "&") {
                    next();
                    token = new Token("AND", "&&");
                } else {
                    token = new Token("AND", "&");
                }
                break;
            case "|":
                next();
                if (ch === "|") {
                    next();
                    token = new Token("OR", "||");
                } else {
                    token = new Token("OR", "|");
                }
                break;
            case "@": next(); token = string("`"); break;
            case "'": token = string("\\"); break;
            case "#": token = datetime(); break;
            default:
                if ("0" <= ch && ch <= "9") {
                    token = number();
                } else if (/[a-zA-Z_$]/.test(ch)) {
                    token = word();
                } else {
                    error("invalid character '" + ch + "'");
                }
            }
            return token;
        }
        at = 0;
        ch = expr.charAt(at);
        return { nextToken: nextToken };
    }
    function Node(token) {
        this.token = token;
        this.children = [];
    }
    Node.prototype.toString = function () {
        var buf, i, len;
        if (this.children.length === 0) {
            return this.token.toString();
        } else {
            buf = [this.token.toString()];
            for(i = 0, len = this.children.length; i < len; i++) {
                buf.push(this.children[i].toString());
            }
            return "(" + buf.join(" ") + ")";
        }
    };
    Node.prototype.push = function (token) {
        this.children.push(token);
    };
    Node.prototype.pop = function () {
        return this.children.pop();
    };
    function Parser(lexer) {
        // EXPR = END
        //      = VALUE (OPERATOR2 VALUE)*
        // VALUE = STRING
        //       = "@" STRING
        //       = NUMBER
        //       = DATE
        //       = BOOLEAN
        //       = FUNCTION "(" (EXPR ("," EXPR)*)* ")"
        //       = "(" EXPR ")"
        //       = OPERATOR1 VALUE
        // OPERATOR2 = "+"
        //           = "-"
        //           = "*"
        //           = "/"
        //           = "%"
        //           = "="
        //           = "=="
        //           = "!="
        //           = ">"
        //           = "<"
        //           = ">="
        //           = "<="
        //           = "&"
        //           = "&&"
        //           = "|"
        //           = "||"
        // OPERATOR1 = "+"
        //           = "-"
        //           = "!"
        // BOOLEAN = "TRUE"
        //         = "FALSE"
        // NULL = "NULL"
        // 
        function error(m) {
            throw new Error("Parser: " + m);
        }
        function consume() {
            token = lexer.nextToken();
            return token;
        }
        function isOP1() {
            switch(token.type){
            case "ADD":
            case "SUB":
            case "NOT":
                return true;
            default:
                return false;
            }
        }
        function OP1(token) {
            switch(token.type){
            case "NOT": return token;
            case "ADD": return new Token("PLUS", "+");
            case "SUB": return new Token("MINUS", "-");
            }
        }
        function isOP2() {
            switch(token.type){
            case "ADD":
            case "SUB":
            case "MUL":
            case "DIV":
            case "MOD":
            case "EQL":
            case "NEQ":
            case "GT":
            case "GTE":
            case "LT":
            case "LTE":
            case "AND":
            case "OR":
                return true;
            default:
                return false;
            }
        }
        function expr() {
            var root = new Node(new Token("EXPR", ""));
            var val, op, parent;
            
            if (token.type === "END") {
                return root; // return
            }
            
            root.push(value());
            while (isOP2()) {
                op = new Node(token);
                consume();
                parent = get_parent_node(root, op);
                op.push(parent.pop());
                op.push(value());
                parent.push(op);
            }
            return root; // return
        }
        function get_parent_node(root, op) {
            var parent = root;
            var child = parent.children[parent.children.length - 1];
            while(op_priority(child.token) < op_priority(op.token)) {
                parent = child;
                child = parent.children[parent.children.length - 1];
            }
            return parent;
        }
        function op_priority(op_token){
            switch(op_token.type){
            case "PLUS":
            case "MINUS":
            case "NOT": return 6;
            case "MUL":
            case "DIV":
            case "MOD": return 5;
            case "ADD":
            case "SUB": return 4;
            case "GT":
            case "LT":
            case "GTE":
            case "LTE":
            case "EQL":
            case "NEQ": return 3;
            case "AND": return 2;
            case "OR": return 1;
            default: return 8;
            }
        }
        function value() {
            var node;
            if (isOP1()) { token = OP1(token); }
            switch(token.type){
            case "NUMBER": 
            case "STRING": 
            case "DATE": 
                node = new Node(token);
                consume(); 
                break;
            case "PLUS":
            case "MINUS":
            case "NOT":
                node = new Node(token);
                consume();
                node.push(value());
                break;
            case "LPA": 
                consume(); // skip LPA
                node = expr();
                if (token.type !== "RPA") { error("missing right parenthesis");}
                consume(); // skip RPA
                break;
            case "WORD":
                switch(token.value) {
                case "true": node = new Node(new Token("BOOLEAN", true)); break;
                case "false": node = new Node(new Token("BOOLEAN", false)); break;
                case "null": node = new Node(new Token("NULL", null)); break;
                case "$": node = new Node(new Token("STDIN", "$")); break;
                default: 
                    node = new Node(new Token("FUNCTION", token.value));
                    consume();
                    if (token.value !== "(") {
                        error("invalid function: '" + node.token.value + "' missing left parenthesis.");
                    }
                    consume();
                    node.push(list());
                    if (token.value !== ")") {
                        error("invalid function: '" + node.token.value + "' missing right parenthesis.");
                    }
                    break;
                }
                consume();
                break;
            default:
                error("expected VALUE, but was " + token.type);
                break;
            }
            return node;
        }
        function list() {
            var node = new Node(new Token("LIST", ""));
            
            if (token.type === "RPA") { return node; }
            
            node.push(expr());
            while (token.type === "COM") {
                consume();
                node.push(expr());
            }
            return node;
        }
        
        var token = lexer.nextToken();
        var ast = expr();
        if (token.type === "END") {
            return ast;
        } else {
            error("too many expr.");
        }
    }
    function Visitor(opts) {
        var fso = WScript.CreateObject("Scripting.FileSystemObject");
        function error(m) {
            throw new Error("Visitor: " + m);
        }
        function expr(node){
            if (opts.debug) { WScript.StdOut.WriteLine(node.toString()); }
            if (node.token.type === "EXPR") {
                return value(node.children[0]);
            } else {
                error("type error: expected EXPR, but was " + node.token.type);
            }
        }
        function value(node) {
            var ret;
            var args = node.children;
            switch(node.token.type){
            case "STDIN": ret = $; break;
            case "PLUS": ret = op_plus(args); break;
            case "MINUS": ret = op_minus(args); break;
            case "NOT": ret = op_not(args); break;
            case "ADD": ret = op_add(args); break;
            case "SUB": ret = op_sub(args); break;
            case "MUL": ret = op_mul(args); break;
            case "DIV": ret = op_div(args); break;
            case "MOD": ret = op_mod(args); break;
            case "EQL": ret = op_eql(args); break;
            case "NEQ": ret = op_neq(args); break;
            case "GT": ret = op_gt(args); break;
            case "GTE": ret = op_gte(args); break;
            case "LT": ret = op_lt(args); break;
            case "LTE": ret = op_lte(args); break;
            case "AND": ret = op_and(args); break;
            case "OR": ret = op_or(args); break;
            case "NUMBER": ret = literal("NUMBER", node); break;
            case "STRING": ret = literal("STRING", node); break;
            case "BOOLEAN": ret = literal("BOOLEAN", node); break;
            case "NULL": ret = literal("NULL", node); break;
            case "DATE": ret = literal("DATE", node); break;
            case "FUNCTION": ret = func(node); break;
            case "EXPR": ret = expr(node); break;
            default: error("type error: " + node.token.type); break;
            }
            return ret;
        }
        function op_minus(args){
            return -value(args[0]);
        }
        function op_plus(args){
            return +value(args[0]);
        }
        function op_not(args) {
            return !value(args[0]);
        }
        function op_add(args) {
            return value(args[0]) + value(args[1]);
        }
        function op_sub(args) {
            return value(args[0]) - value(args[1]);
        }
        function op_mul(args) {
            return value(args[0]) * value(args[1]);
        }
        function op_div(args) {
            return value(args[0]) / value(args[1]);
        }
        function op_mod(args) {
            return value(args[0]) % value(args[1]);
        }
        function op_eql(args) {
            return value(args[0]) === value(args[1]);
        }
        function op_neq(args) {
            return value(args[0]) !== value(args[1]);
        }
        function op_gt(args) {
            return value(args[0]) > value(args[1]);
        }
        function op_gte(args) {
            return value(args[0]) >= value(args[1]);
        }
        function op_lt(args) {
            return value(args[0]) < value(args[1]);
        }
        function op_lte(args) {
            return value(args[0]) <= value(args[1]);
        }
        function op_mul(args) {
            return value(args[0]) * value(args[1]);
        }
        function op_and(args) {
            return value(args[0]) && value(args[1]);
        }
        function op_or(args) {
            return value(args[0]) || value(args[1]);
        }
        function literal(type, node) {
            if (node.token.type === type) {
                return node.token.value;
            } else {
                error("expected " + type + ", but was " + node.token.type)
            }
        }
        function func(node) {
            try {
                var ret;
                var ary = list(node.children[0]);
                switch(node.token.value){
                // filesystem
                case "fullpath": ret = fso.GetAbsolutePathName(value(ary[0])); break;
                case "file": ret = fso.FileExists(value(ary[0]));break;
                case "empty": ret = func_empty(value(ary[0])); break;
                case "folder":
                case "dir": ret = fso.FolderExists(value(ary[0])); break;
                case "size": ret = fso.GetFile(value(ary[0])).Size; break;
                case "depth": ret = value(ary[0]).split("\\").length; break;
                case "cdate": ret = new Date(fso.GetFile(value(ary[0])).DateCreated); break;
                case "mdate": ret = new Date(fso.GetFile(value(ary[0])).DateLastModified); break;
                case "adate": ret = new Date(fso.GetFile(value(ary[0])).DateLastAccessed); break;
                
                // string
                case "to_n": ret = +value(ary[0]); break;
                case "length": ret = value(ary[0]).length; break;
                case "slice": ret = func_slice(ary); break;
                case "indexof": ret = func_indexof(ary); break;
                case "upper": ret = value(ary[0]).toUpperCase(); break;
                case "lower": ret = value(ary[0]).toLowerCase(); break;
                
                // date
                case "today": ret = new Date(); break;
                case "yesterday": ret = new Date(new Date() - 24*60*60*1000); break;
                case "tomorrow": ret = new Date(new Date() - (-24*60*60*1000)); break;
                
                // math
                case "sqrt": ret = Math.sqrt(value(ary[0])); break;
                case "sin": ret = Math.sin(value(ary[0])); break;
                case "cos": ret = Math.cos(value(ary[0])); break;
                case "tan": ret = Math.tan(value(ary[0])); break;
                case "floor": ret = Math.floor(value(ary[0])); break;
                case "ceil": ret = Math.ceil(value(ary[0])); break;
                case "round": ret = Math.round(value(ary[0])); break;
                case "pow": ret = Math.pow(value(ary[0]), value(ary[1])); break;
                default: throw new Error("not found."); break;
                }
                return ret;
            } catch (e) {
                error(node.token.value + "(): " + e.message);
            }
        }
        function list(node) {
            if (node.token.type === "LIST") {
                return node.children;
            } else {
                error("tyep error: expected LIST, but was " + node.token.type);
            }
        }
        function func_empty(path) {
            if (fso.FileExists(path)) {
                return fso.GetFile(path).Size === 0;
            } else if (fso.FolderExists(path)) {
                var folder = fso.GetFolder(path);
                return folder.files.count === 0 && folder.subFolders.count === 0;
            } else {
                throw new Error("file or folder not found: " + path);
            }
        }
        function func_indexof(ary) {
            var str1 = value(ary[0]);
            var str2 = value(ary[1]);
            return str1.indexOf(str2);
        }
        function func_slice(ary) {
            var str = value(ary[0]);
            var start = value(ary[1]);
            var end = ary[2] === void 0 ? void 0 : value(ary[2]);
            return str.slice(start, end);
        }
        function write(ret) {
            switch(Object.prototype.toString.call(ret).slice(8, -1)){
            case "Object": WScript.StdOut.WriteLine("null"); break;
            case "Boolean":
            case "Number": 
            case "Date": WScript.StdOut.WriteLine(ret.toString()); break;
            case "String":
            default: WScript.StdOut.WriteLine(ret); break;
            }
        }
        var $;
        function eval(ast) {
            var ret;
            if (opts.stdin) {
                while(!WScript.StdIn.AtEndOfStream){
                    $ = WScript.StdIn.ReadLine();
                    ret = expr(ast);
                    if (!opts.silent) { write(ret); }
                    if (opts.filter && ret) { WScript.StdOut.WriteLine($); }
                }
            } else {
                ret = expr(ast);
                if (!opts.silent) { write(ret); }
            }
            return ret
        }
        return { eval: eval };
    }
    
    try {
        // expr = "";
        // expr = "length(1)";
        // expr = "file(@'C:\\test.xt')";
        var lexer = Lexer(expr);
        
        /*
        echo("start");
        echo(lexer.nextToken().toString());
        echo(lexer.nextToken().toString());
        echo(lexer.nextToken().toString());
        echo(lexer.nextToken().toString());
        echo(lexer.nextToken().toString());
        echo("end");
        */
        
        var ast = Parser(lexer);
        // echo(ast.toString());
        
        var visitor = Visitor(opts);
        var ret = visitor.eval(ast);
        if (ret === false || ret === null || ret !== ret) {
            // false, null, NaN
            WScript.Quit(1);
        } else {
            WScript.Quit(0);
        }
    } catch(e) {
        WScript.StdErr.WriteLine("Eval: " + e.message)
        WScript.Quit(2);
    }
}

var args, opts, expr;
args = parse_arguments();
opts = args.opts;
expr = args.files.join(" ") || "";

evalate(opts, expr);
