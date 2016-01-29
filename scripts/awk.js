function Token(type, value, head, tail) {
    return {
        type: type,
        value: value,
        head: head,
        tail: tail,
        toString: function() { return "[" + type + "] " + value + " (" + head + ", " + tail + ")"; }
    };
}
function Lexer(text) {
    return (function (text) {
        var at = 0,
            pos = 0,
            ch = text.charAt(0),
            token,
            operators = ["+", "-", "*", "/", "%", "&", "|", ";", ":", "?", "'", '"', "!", 
                        "(", ")", "[", "]", "{", "}", "^", "~", "\\", "=", ".", ",", "?"];
        
        function error(m) {
            throw new Error(m + "(" + pos + ")");
        }
        function next() {
            at += 1;
            ch = text.charAt(at);
            return ch;
        }
        function white() {
            while(ch === " " || ch === "\t") {
                next();
            }
        }
        function nextToken() {
            pos = at;
            white();
            pos = at;
            switch(ch){
            case "" : token = Token("EOF", "", pos, pos + 1); break;
            case "\r":
            case "\n":token = newline(); break;
            case "(": next(); token = Token("LPAREN", "(", pos, at); break;
            case ")": next(); token = Token("RPAREN", ")", pos, at); break;
            case "[": next(); token = Token("LBRACKET", "[", pos, at); break;
            case "]": next(); token = Token("RBRACKET", "]", pos, at); break;
            case "{": next(); token = Token("LBRACE", "{", pos, at); break;
            case "}": next(); token = Token("RBRACE", "}", pos, at); break;
            case ":": next(); token = Token("COLON", ":", pos, at); break;
            case ";": next(); token = Token("TERM", ";", pos, at); break;
            case "?": next(); token = Token("QUES", "?", pos, at); break;
            case ",": next(); token = Token("COMMA", ",", pos, at); break;
            case "~": next(); token = Token("MATCH", "~", pos, at); break;
            case '"': token = string('"'); break;
            case "'": token = string ("'"); break;
            case "!": next();
                if (ch === "~") { white(); token = regexp(false); }
                else if (ch === "~") { token = Token("UNMATCH", "!~", pos, at); }
                else if (ch === "=") { token = Token("NEQ", "!=", pos, at); }
                else { token = Token("NOT", "!", pos, at); }
                break;
            case "^": next();
                if (ch === "=") { token = Token("POWASSIGN", "^=", pos, at); }
                else { token = Token("POW", "^", pos, at); }
                break;
            case "+": next();
                if (ch === "=") { next(); token = Token("ADDASSIGN", "+=", pos, at); }
                else if (ch === "+") { next(); token = Token("INCREMENT", "++", pos, at); }
                else { token = Token("ADD", "+", pos, at); }
                break;
            case "-": next();
                if (ch === "=") { next(); token = Token("SUBASSIGN", "-=", pos, at); }
                else if (ch === "-") { next(); token = Token("DECREMENT", "--", pos, at); }
                else { token = Token("SUB", "-", pos, at); }
                break;
            case "*": next();
                if (ch === "=") { next(); token = Token("MULASSIGN", "*=", pos, at);}
                else {token = Token("MUL", "*", pos, at); }
                break;
            case "/": next();
                if (ch === "/") { next(); LineComment(); token = nextToken(); }
                else if (ch === "*") { next(); BlockComment(); token = nextToken(); }
                else if (token === void 0) { token = regexp(); }
                else if (token.value === "{") { token = regexp(); }
                else if (token.value === "}") { token = regexp(); }
                else if (token.value === "(") { token = regexp(); }
                else if (token.value === "[") { token = regexp(); }
                else if (token.value === ",") { token = regexp(); }
                else if (token.value === ";") { token = regexp(); }
                else if (token.value === "~") { token = regexp(); }
                else if (token.value === "!~") { token = regexp(); }
                else if (token.value === "\r") { token = regexp(); }
                else if (token.value === "\n") { token = regexp(); }
                else if (ch === "=") { next(); token = Token("DIVASSIGN", "/=", pos, at); }
                else {token = Token("DIV", "/", pos, at); }
                break;
            case "%": next();
                if (ch === "=") { next(); token = Token("MODASSIGN", "%=", pos, at); }
                else {token = Token("MOD", "%", pos, at); }
                break;
            case "&": next();
                if (ch === "&") { next(); token = Token("AND", "&&", pos, at); }
                else { error("syntax error: unrecognised operator.");}
                break;
            case "|": next();
                if (ch === "|") { next(); token = Token("OR", "||", pos, at); }
                else { token = Token("PIPE", "|", pos, at); }
                break;
            case ">": next();
                if (ch === "=") { next(); token = Token("GTE", ">=", pos, at); }
                else if (ch === ">") { next(); token = Token("APPEND", ">>", pos, at); }
                else { token = Token("GT", ">", pos, at); }
                break;
            case "<": next();
                if (ch === "=") { next(); token = Token("LTE", "<=", pos, at); }
                else { token = Token("LT", "<", pos, at); }
                break;
            case "=":
                next();
                if (ch === "=") { next(); token = Token("EQ", "==", pos, at);}
                else { token = Token("ASSIGN", "=", pos, at);}
                break;
            default:
                if ('0' <= ch && ch <= '9') {
                    token = number();
                } else {
                    token = word();
                }
            }
            return token;
        }
        function isOperator(c) {
            var i;
            for(i = 0, len = operators.length; i < len; i++) {
                if (c === operators[i]) { return true; }
            }
            return false;
        }
        function newline() {
            pos = at;
            if (ch === "\r") {
                next();
                if (ch === "\n") {
                    next();
                    return Token("NEWLINE", "\r\n", pos, at);
                } else {
                    return Token("NEWLINE", "\r", pos, at);
                }
            } else if (ch === "\n") {
                next();
                return Token("NEWLINE", "\r\n", pos, at);
            }
        }
        function LineComment() {
            while(ch !== ""){
                if (ch === "\r") { break;}
                if (ch === "\n") { break;}
                next();
            }
            if (ch === "\r") {
                next();
                if (ch === "\n") { next();}
            }
        }
        function BlockComment() {
            while(ch !== ""){
                if (ch === "*") {
                    next();
                    if (ch === "/") { next(); break;}
                }
                next();
            }
        }
        function regexp() {
            var buf = []
            pos = at;
            while(ch !== "/"){
                if (ch === "") { error("syntax error: unclosed regexp.");}
                if (ch === "\\") {
                    next();
                    switch(ch){
                    case "n": ch = "\n"; break;
                    case "r": ch = "\n"; break;
                    case "\\":ch = "\\"; break;
                    case "/" :ch = "/"; break;
                    }
                }
                buf.push(ch)
                next();
            }
            next(); // skip /
            return Token("REGEXP", buf.join(""), pos, at);
        }
        function string(q) {
            var buf = [];
            pos = at;
            next(); // skip quote
            while(ch !== q) {
                if (ch === "") { error("syntax error: unclosed string."); }
                if (ch === "\\") {
                    next();
                    switch(ch){
                    case "n": ch = "\n"; break;
                    case "r": ch = "\r"; break;
                    case "\\":ch = "\\"; break;
                    case "/": ch = "/"; break;
                    }
                }
                buf.push(ch);
                next();
            }
            next(); // skip quote
            return Token("STRING", buf.join(""), pos, at);
        }
        function number() {
            var buf = [];
            pos = at;
            while ('0' <= ch && ch <= '9') {
                buf.push(ch);
                next();
            }
            if (ch === ".") {
                buf.push(ch);
                while(next() && '0' <= ch && ch <= '9') {
                    buf.push(ch);
                }
            }
            if (ch === "e" || ch === "E") {
                buf.push(ch);
                next();
                if (ch === "-" || ch === "+") {
                    buf.push(ch);
                    next();
                }
                while('0' <= ch && ch <= '9') {
                    buf.push(ch);
                    next();
                }
            }
            return Token("NUMBER", buf.join(), pos, at);
        }
        function word() {
            var buf = [];
            pos = at;
            while(true){
                if (ch <= " ") { break;}
                if (isOperator(ch)) { break;}
                buf.push(ch);
                next();
            }
            return Token("WORD", buf.join(""), pos, at);
        }
        return {
            nextToken: nextToken
        }
    })(text);
}
function Node(name, token) {
    return {
        name: name,
        token: token,
        children: [],
        push: function (node) { this.children.push(node);},
        pop: function () { return this.children.pop(); },
        append: function (node) { node.push(this); }
    }
}
function Parser(lexer){
    return (function(lexer){
        var root = null,
            curr = null,
            i = 0,
            k = 10,
            p = 0,
            lookahead = [],
            markers = [];
        function consume() {
            p++;
            if (p === lookahead.length && !isSpeculating()) {
                p = 0;
                lookahead = [];
            }
            sync(1);
        }
        function sync(i) {
            var n;
            if (p+i-1 > (lookahead.length - 1)) {
                n = (p+i - 1) - (lookahead.length - 1);
                fill(n);
            }
        }
        function fill(n) {
            var i;
            for (i = 0; i <= n; i++) {
                lookahead.push(lexer.nextToken());
            }
        }
        function LT(i){
            sync(i);
            return lookahead[p+i-1];
        }
        function LA(i){
            return LT(i).type;
        }
        function mark() { markers.push(p); return p; }
        function release() {
            var marker = markers.pop();
            seek(marker);
        }
        function seek(index) { p = index; }
        function isSpeculating() { return markers.length > 0; }
        function match(type) {
            if (LA(1) !== type) { throw new Error("expecting " + x + "; found " + LT(1)); }
            consume();
        }
        function _program() {
            WScript.Echo("parse list rule at token index: " + index());
            match(BacktrackLexer.LBRACK);
            elements();
            match(BacktrackLexer.RBRACK);
        }
        function program() {
            var failed = false;
            var startTokenIndex = index();
            if (isSpeculating() && alreadyParsedRule(list_memo)) return;
            try { _program();}
            catch (e) { failed = true; throw new Error("");}
            finally {
                if (isSpeculating()) { memoize(list_memo, startTokenIndex, failed);}
            }
        }
        function alreadyParsedRule(memoization) {
            var memoI = memoization[index()];
            if (memoI === null) { return false;}
            var memo = memoI.intValue();
            WScript.Echo("parsed list before at index" + index() + "; skip ahead to token index" + memo + ": " + lookahead[memo].text);
            seek(memo);
            return true;
        }
        function memoize(memoization, startTokenIndex, failed) {
            var stopTokenIndex = failed ? FAILED : index(); 
            memoization.put(startTokenIndex, stopTokenIndex);
        }
        function index() { return p; }
        
        function program() {
            if (speculate_item_list()) {
                
            } else if (speculate_actionless_item_list()) {
                
            } else {
                throw new Error("NoViableAltException");
            }
        }
        function speculate_item_list() {
            var success = true;
            mark();
            try {}
            catch (e) {}
            release();
            return success;
        }
        function speculate_actionless_item_list() {
            var success = true;
            mark();
            try {}
            catch (e) {}
            release();
            return success;
        }
        
        
        
        // exec
        for(i = 0; i < k; i++){
            consume();
        }
        return {};
    })(lexer);
}
function Parser(lex) {
    return (function (lexer) {
        var lookahead = [],
            k = 10,
            p = 0;
            
        // util functions
        function consume() {
            lookahead[p] = lexer.nextToken();
            p = (p+1) % k;
        }
        function LA(i) { return lookahead[(p+i-1) % k]; }
        function LT(i) { return LT(i).type; }
        function match(type) {
            if (LA(1) === type) { consume();}
            else { throw new Error("expecting " + type + "; found " + LT(1);}
        }
        
        // grammar
        function NEWLINE() {}
        function NUMBER() {}
        function STRING() {}
        function NAME() {}
        function DOLLAR() {}
        function FUNC_NAME() {}
        function FUNCTION() {}
        function BEGIN() {}
        function END() {}
        function DO() {}
        function FOR() {}
        function WHILE() {}
        function IF() {}
        function ELSE() {}
        function IN() {}
        function BREAK() {}
        function CONTINUE() {}
        function NEXT() {}
        function EXIT() {}
        function RETURN() {}
        function DELETE() {}
        function PRINT() {}
        function PRINTF() {}
        function ERE() {}
        function BUILTIN_FUNC_NAME() {}
        function GETLINE() {}
        
        function program() {
            var node = Node("PROGRAM", null);
            consume();
            switch(token.type) {
            case "EOF": break;
            case "": node.push(actionless_item_list()); break;
            case "": node.push(item_list()); break;
            }
            return node;
        }
        function item_list() {
            var node = Node("ITEM_LIST", null);
            switch(token.value){
            case "": newline_opt(); break;
            case "": actionless_item_list(); item(); terminator(); break;
            case "": item_list(); item(); terminator(); break;
            case "": item_list(); action(); terminator(); break;
            }
            return node;
        }
        function actionless_item_list() {
            var node = Node("ACTIONLESS_ITEM_LIST", null);
            switch(token.value){
            case "": item_list(); pattern(); terminator(); break;
            case "": actionless_item_list(); pattern(); terminator(); break;
            }
            return node;
        }
        function item() {
            var node = Node("ITEM", null);
            switch(token.value){
            case "": pattern(); action(); break;
            case "": FUNCTION(); NAME(); match("LPAREN"); param_list_opt(); match("RPAREN"); newline_opt(); action(); break;
            case "": FUNCTION(); FUNC_NAME(); match("LPAREN"); param_list_opt(); match("RPAREN"); newline_opt(); action(); break;
            }
            return node;
        }
        function param_list_opt() {
            var node = Node("PARAM_LIST_OPT", null);
            switch(token.value){
            case "": break;
            case "": param_list(); break;
            }
            return node;
        }
        function param_list() {
            var node = Node("PARAM_LIST", null);
            switch(token.value){
            case "": NAME(); break;
            case "": param_list(); match("COMMA"); NAME(); break;
            }
            return node;
        }
        function pattern() {
            var node = Node("PATTERN", null);
            switch(token.value) {
            case "": BEGIN(); break;
            case "": END(); break;
            case "": expr(); break;
            case "": expr(); match("COMMA"); newline_opt(); expr(); break;
            }
            return node;
        }
        function action() {
            var node = Node("ACTION", null);
            switch(token.value){
            case "": match("LBRACE"); newline_opt(); match("RBRACE"); break;
            case "": match("LBRACE"); newline_opt(); terminated_statement_list(); match("RBRACE"); break;
            case "": match("LBRACE"); newline_opt(); unterminated_statement_list(); match("RBRACE"); break;
            }
            return node;
        }
        function terminator() {
            var node = Node("TERMINATOR", null);
            switch(token.value) {
            case "": term(); match("TERM"); break;
            case "": term(); NEWLINE(); break;
            }
            return node;
        }
        function term() {
            var node = Node("TERM", null);
            switch(token.value){
            case "": match("TERM"); break;
            case "": NEWLINE(); break;
            }
            return node;
        }
        function terminated_statement_list() {
            var node = Node("TERMINATED_STATEMENT_LIST", null);
            switch(token.value) {
            case "": terminated_statement(); break;
            case "": terminated_statement_list(); terminated_statement(); break;
            }
            return node;
        }
        function unterminated_statement_list() {
            var node = Node("UNTERMINATED_STATEMENT_LIST", null);
            switch(token.value) {
            case "": unterminated_statement(); break;
            case "": terminated_statement_list(); unterminated_statement(); break;
            }
            return node;
        }
        function terminated_statement() {
            var node = Node("TERMINATED_STATEMENT", null);
            switch(token.value) {
            case "": action(); newline_opt(); break;
            case "": IF(); match("LPAREN"); expr(); match("RPAREN"); newline_opt(); terminated_statement(); break;
            case "": IF(); match("LPAREN"); expr(); match("RPAREN"); newline_opt(); terminated_statement(); 
                     ELSE(); newline_opt(); terminated_statement(); break;
            case "": WHILE(); match("LPAREN"); expr(); match("RPAREN"); newline_opt(); terminated_statement(); 
            case "": FOR(); match("LPAREN"); simple_statement_opt(); match("TERM"); expr_opt(); match("TERM"); 
                     simple_statement_opt(); match("RPAREN"); newline_opt(); terminated_statement(); break;
            case "": FOR(); match("LPAREN"); NAME(); IN(); NAME(); match("RPAREN"); newline_opt(); break;
            case "": match("TERM"); newline_opt(); break;
            case "": terminatable_statement(); NEWLINE(); newline_opt(); break;
            case "": terminatable_statement(); match("TERM"); newline_opt(); break;
            }
            return node;
        }
        function unterminated_statement() {
            var node = Node("UNTERMINATED_STATEMENT", null);
            switch(token.value) {
            case "": terminatable_statement(); break;
            case "": IF(); match("LPAREN"); expr(); match("RPAREN"); newline_opt(); unterminated_statement(); break;
            case "": IF(); match("LPAREN"); expr(); match("RPAREN"); newline_opt(); terminated_statement(); 
                     ELSE(); newline_opt(); unterminated_statement(); break;
            case "": WHILE(); match("LPAREN"); expr(); match("RPAREN"); newline_opt(); unterminated_statement(); break;
            case "": FOR(); match("LPAREN"); simple_statement_opt(); match("TERM"); expr_opt(); match("TERM"); simple_statement_opt(); match("RPAREN"); newline_opt(); unterminated_statement(); break;
            case "": FOR(); match("LPAREN"); NAME(); IN(); NAME(); newline_opt(); unterminated_statement();
            }
            return node;
        }
        function terminatable_statement() {
            var node = Node("TERMINATABLE_STATEMENT", null);
            switch(token.value) {
            case "": simple_statement(); break;
            case "": BREAK(); break;
            case "": CONTINUE(); break;
            case "": NEXT(); break;
            case "": EXIT(); expr_opt(); break;
            case "": RETURN(); expr_opt(); break;
            case "": DO(); newline_opt(); terminated_statement(); WHILE(); match("LPAREN"); expr(); match("RPAREN"); break;
            }
            return node;
        }
        function simple_statement_opt() {
            var node = Node("SIMPLE_STATEMENT_OPT", null);
            switch(token.value){
            case "": break;
            case "": simple_statement(); break;
            }
            return node;
        }
        function simple_statement() {
            var node = Node("SIMPLE_STATEMENT", null);
            switch(token.value) {
            case "": DELETE(); NAME(); match("LBRACKET"); expr_list(); match("RBRACKET"); break;
            case "": expr(); break;
            case "": print_statement(); break;
            }
            return node;
        }
        function print_statement() {
            var node = Node("PRINT_STATEMENT", null);
            switch(token.value){
            case "": simple_statement(); break;
            case "": simple_print_statement(); output_redirection(); break;
            }
            return node;
        }
        function simple_print_statement() {
            var node = Node("SIMPLE_PRINT_STATEMENT", null);
            switch(token.value){
            case "": PRINT(); print_expr_list_opt(); break;
            case "": PRINT(); match("LPAREN"); multiple_expr_list(); match("RPAREN"); break;
            case "": PRINTF(); print_expr_list(); break;
            case "": PRINTF(); match("LPAREN"); print_expr_list(); match("RPAREN"); break;
            }
            return node;
        }
        function output_redirection() {
            var node = Node("OUTPUT_REDIRECTION", null);
            switch(token.value) {
            case "": match("GT"); expr(); break;
            case "": match("APPEND"); expr(); break;
            case "": match("PIPE"); expr(); break;
            }
            return node;
        }
        function expr_list_opt() {
            var node = Node("EXPR_LIST_OPT", null);
            switch(token.value) {
            case "": break;
            case "": expr();
            }
            return node;
        }
        function expr_list() {
            var node = Node("EXPR_LIST", null);
            switch(token.value){
            case "": expr(); break;
            case "": multiple_expr_list(); break;
            }
            return node;
        }
        function multiple_expr_list() {
            var node = Node("MULTIPLE_EXPR_LIST", null);
            switch(token.value){
            case "": expr(); match("COLON"); newlist_opt(); expr(); break;
            case "": multiple_expr_list(); match("COLON"); newline_opt(); expr(); break;
            }
            return node;
        }
        function expr() {
            var node = Node("EXPR", null);
            switch(token.value){
            case "": unary_expr(); break;
            case "": non_unary_expr(); break;
            }
            return node;
        }
        function unary_expr() {
            var node = Node("UNARY_EXPR", null);
            switch(token.value){
            case "": match("ADD"); expr(); break;
            case "": match("SUB"); expr(); break;
            case "": unary_expr(); match("POW"); expr(); break;
            case "": unary_expr(); match("MUL"); expr(); break;
            case "": unary_expr(); match("DIV"); expr(); break;
            case "": unary_expr(); match("MOD"); expr(); break;
            case "": unary_expr(); match("ADD"); expr(); break;
            case "": unary_expr(); match("SUB"); expr(); break;
            case "": unary_expr(); non_unary_expr(); break;
            case "": unary_expr(); match("LT"); expr(); break;
            case "": unary_expr(); match("LTE"); expr(); break;
            case "": unary_expr(); match("NEQ"); expr(); break;
            case "": unary_expr(); match("EQ"); expr(); break;
            case "": unary_expr(); match("GT"); expr(); break;
            case "": unary_expr(); match("GTE"); expr(); break;
            case "": unary_expr(); match("MATCH"); expr(); break;
            case "": unary_expr(); match("UNMATCH"); expr(); break;
            case "": unary_expr(); IN(); NAME(); break;
            case "": unary_expr(); match("AND"); newline_opt(); expr(); break;
            case "": unary_expr(); match("OR"); newline_opt(); expr(); break;
            case "": unary_expr(); match("QUES"); expr(); match("COLON"); expr(); break;
            case "": unary_input_function(); break;
            }
            return node;
        }
        function non_unary_expr() {
            var node = Node("NON_UNARY_EXPR", null);
            switch(token.value){
            case "": match("LPAREN"); expr(); match("RPAREN"); break;
            case "": match("NOT"); expr(); break;
            case "": non_unary_expr(); match("POW"); expr(); break;
            case "": non_unary_expr(); match("MUL"); expr(); break;
            case "": non_unary_expr(); match("DIV"); expr(); break;
            case "": non_unary_expr(); match("MOD"); expr(); break;
            case "": non_unary_expr(); match("ADD"); expr(); break;
            case "": non_unary_expr(); match("SUB"); expr(); break;
            case "": non_unary_expr(); non_unary_expr(); break;
            case "": non_unary_expr(); match("LT"); expr(); break;
            case "": non_unary_expr(); match("LTE"); expr(); break;
            case "": non_unary_expr(); match("NEQ"); expr(); break;
            case "": non_unary_expr(); match("EQ"); expr(); break;
            case "": non_unary_expr(); match("GT"); expr(); break;
            case "": non_unary_expr(); match("GTE"); expr(); break;
            case "": non_unary_expr(); match("MATCH"); expr(); break;
            case "": non_unary_expr(); match("UNMATCH"); expr(); break;
            case "": non_unary_expr(); IN(); NAME(); break;
            case "": match("LPAREN"); multiple_expr_list(); match("RPAREN"); IN(); NAME(); break;
            case "": non_unary_expr(); match("AND"); newline_opt(); expr(); break;
            case "": non_unary_expr(); match("OR"); newline_opt(); expr(); break;
            case "": non_unary_expr(); match("QUES"); expr(); match("COLON"); expr(); break;
            case "": NUMBER(); break;
            case "": STRING(); break;
            case "": lvalue(); break;
            case "": ERE(); break;
            case "": lvalue(); match("INCREMENT"); break;
            case "": lvalue(); match("DECREMENT"); break;
            case "": match("INCREMENT"); lvalue(); break;
            case "": match("DECREMENT"); lvalue(); break;
            case "": lvalue(); match("POWASSIGN"); expr(); break;
            case "": lvalue(); match("MODASSIGN"); expr(); break;
            case "": lvalue(); match("MULASSIGN"); expr(); break;
            case "": lvalue(); match("DIVASSIGN"); expr(); break;
            case "": lvalue(); match("ADDASSIGN"); expr(); break;
            case "": lvalue(); match("SUBASSIGN"); expr(); break;
            case "": lvalue(); match("EQ"); expr(); break;
            case "": FUNC_NAME(); match("LPAREN"); expr_list_opt(); match("RPAREN"); break;
            case "": BUILTIN_FUNC_NAME(); match("LPAREN"); expr_list_opt(); match("RPAREN"); break;
            case "": BUILTIN_FUNC_NAME(); break;
            case "": non_unary_input_function(); break;
            }
            return node;
        }
        function unary_print_expr() {
            var node = Node("UNARY_PRINT_EXPR", null);
            switch(token.value) {
            case "": match("ADD"); print_expr(); break;
            case "": match("SUB"); print_expr(); break;
            case "": unary_print_expr(); match("POW"); print_expr(); break;
            case "": unary_print_expr(); match("MUL"); print_expr(); break;
            case "": unary_print_expr(); match("DIV"); print_expr(); break;
            case "": unary_print_expr(); match("MOD"); print_expr(); break;
            case "": unary_print_expr(); match("ADD"); print_expr(); break;
            case "": unary_print_expr(); match("SUB"); print_expr(); break;
            case "": unary_print_expr(); non_unary_print_expr(); break;
            case "": unary_print_expr(); match("MATCH"); print_expr(); break;
            case "": unary_print_expr(); match("UNMATCH"); print_expr(); break;
            case "": unary_print_expr(); IN(); NAME(); break;
            case "": unary_print_expr(); match("AND"); newline_opt(); print_expr(); break;
            case "": unary_print_expr(); match("OR"); newline_opt(); print_expr(); break;
            case "": unary_print_expr(); match("QUES"); print_expr(); match("COLON"); print_expr(); break;
            }
            return node;
        }
        function non_unary_print_expr() {
            var node = Node("NON_UNARY_PRINT_EXPR", null);
            switch(token.value) {
            case "": match("LPAREN"); expr(); match("RPAREN"); break;
            case "": non_unary_print_expr(); match("POW"); print_expr(); break;
            case "": non_unary_print_expr(); match("MUL"); print_expr(); break;
            case "": non_unary_print_expr(); match("DIV"); print_expr(); break;
            case "": non_unary_print_expr(); match("MOD"); print_expr(); break;
            case "": non_unary_print_expr(); match("ADD"); print_expr(); break;
            case "": non_unary_print_expr(); match("SUB"); print_expr(); break;
            case "": non_unary_print_expr(); non_unary_print_expr(); break;
            case "": non_unary_print_expr(); match("MATCH"); print_expr(); break;
            case "": non_unary_print_expr(); match("UNMATCH"); print_expr(); break;
            case "": non_unary_print_expr(); IN(); NAME(); break;
            case "": match("("); multiple_expr_list(); match(")"); IN(); NAME(); break;
            case "": non_unary_print_expr(); match("AND"); newline_opt(); print_expr(); break;
            case "": non_unary_print_expr(); match("OR"); newline_opt(); print_expr(); break;
            case "": non_unary_print_expr(); match("QUES"); print_expr(); match("COLON"); print_expr(); break;
            case "": NUMBER(); break;
            case "": STRING(); break;
            case "": lvalue(); break;
            case "": ERE(); break;
            case "": lvalue(); INCR(); break;
            case "": lvalue(); DECR(); break;
            case "": lvalue(); POW_ASSIGN(); print_expr(); break;
            case "": lvalue(); MOD_ASSIGN(); print_expr(); break;
            case "": lvalue(); MUL_ASSIGN(); print_expr(); break;
            case "": lvalue(); DIV_ASSIGN(); print_expr(); break;
            case "": lvalue(); ADD_ASSIGN(); print_expr(); break;
            case "": lvalue(); SUB_ASSIGN(); print_expr(); break;
            case "": lvalue(); match("="); print_expr(); break;
            case "": FUNC_NAME(); match("LPAREN"); expr_list_opt(); match("RPAREN"); break;
            case "": BUILTIN_FUNC_NAME(); match("LPAREN"); expr_list_opt(); match("RPAREN"); break;
            case "": BUILTIN_FUNC_NAME(); break;
            }
            return node;
        }
        function lvalue() {
            var node = Node("LVALUE", null);
            switch(token.value){
            case "": NAME(); break;
            case "": NAME(); match("LBRACKET"); expr_list(); match("RBRACKET"); break;
            case "": DOLLAR(); expr(); break;
            }
            return node;
        }
        function non_unary_input_function() {
            var node = Node("NON_UNARY_INPUT_FUNCTION", null);
            switch(token.value) {
            case "": simple_get(); break;
            case "": simple_get(); match("GT"); expr(); break;
            case "": non_unary_expr(); match("PIPE"); simple_get(); break;
            }
            return node;
        }
        function unary_input_function() {
            var node = Node("UNARY_INPUT_FUNCTION", null);
            switch(token.value){
            case "": unary_expr(); match("PIPE"); simple_get(); break;
            }
            return node;
        }
        function simple_get() {
            var node = Node("SIMPLE_GET", null);
            switch(token.value){
            case "": GETLINE(); break;
            case "": GETLINE(); lvalue(); break;
            }
            return node;
        }
        function newline_opt(){
            var node = Node("NEWLINE", null);
            switch(token.value){
            case "": break;
            case "": newline_opt(); NEWLINE(); break;
            }
            return node;
        }
        
        // initialize
        var i;
        for(i = 0, i < k; i++){
            consume();
        }
        return program();
    })(lex);
}
function visitor() {

}
function echo(m){
    WScript.Echo(m);
}
var text = "";
echo();
echo(text);
echo();
var lex = Lexer(text);
// var token = lex.nextToken();
// while(token.type !== "EOF") {
//    echo(token.toString());
//    token = lex.nextToken();
// }

// var parser = Parser(lex);

