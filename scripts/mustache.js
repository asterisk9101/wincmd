// [Usage]
// 名前
//     mustache - Logic-less templates.
// 
// 文法
//     mustache TEMPLATE DATA...
//     mustache [/?] [/help] [/version]
// 
// 説明
//     mustache は与えらえた TEMPLATE と DATA を結合してテキストを生成する。
// 
// TEMPLATE
//     典型的なテンプレートは {{ と }} に囲まれたタグを含む、
//     以下のようなテキストとして与えられる。
// 
//         Hello {{name}}
//         You have just won {{value}} dollars!
//         {{#in_ca}}
//         Well, {{taxed_value}} dollars, after taxes.
//         {{/in_ca}}
// 
//     上記のテンプレートに対して、以下のようなデータを与える。
//     データは JSON フォーマットのテキストである。
// 
//         {
//             "name": "Chris",
//             "value": 10000,
//             "taxed_value": 6000.0,
//             "in_ca": true
//         }
// 
//     生成されるテキストは以下のようになる。
// 
//         Hello Chris
//         You have just won 10000 dollars!
//         Well, 6000.0 dollars, after taxes.
//
// タグタイプ
//     Section
//     Inverted
//     Variable
//     Import
//     Comment
//     Set Delimiter
// 
// オリジナルの mustache との差異
//     使用できるタグタイプが少ない(function, parcials etc.)
//     データは JSON フォーマットテキストのみ
//     etc.
// 

// [Version]
// mustache version 0.1


// https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
var json_parse = (function () {
    "use strict";

// This is a function that can parse a JSON text, producing a JavaScript
// data structure. It is a simple, recursive descent parser. It does not use
// eval or regular expressions, so it can be used as a model for implementing
// a JSON parser in other languages.

// We are defining the function inside of another function to avoid creating
// global variables.

    var at,     // The index of the current character
        ch,     // The current character
        escapee = {
            '"': '"',
            '\\': '\\',
            '/': '/',
            b: '\b',
            f: '\f',
            n: '\n',
            r: '\r',
            t: '\t'
        },
        text,

        error = function (m) {

// Call error when something is wrong.

            throw new Error(12345, "json_parse", "SyntaxError: " + m + " (" + at + ")");
            //throw {
            //    name: 'SyntaxError',
            //    message: m,
            //    at: at,
            //    text: text
            //};
        },

        next = function (c) {

// If a c parameter is provided, verify that it matches the current character.

            if (c && c !== ch) {
                error("Expected '" + c + "' instead of '" + ch + "'");
            }

// Get the next character. When there are no more characters,
// return the empty string.

            ch = text.charAt(at);
            at += 1;
            return ch;
        },

        number = function () {

// Parse a number value.

            var number,
                string = '';

            if (ch === '-') {
                string = '-';
                next('-');
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
            if (ch === '.') {
                string += '.';
                while (next() && ch >= '0' && ch <= '9') {
                    string += ch;
                }
            }
            if (ch === 'e' || ch === 'E') {
                string += ch;
                next();
                if (ch === '-' || ch === '+') {
                    string += ch;
                    next();
                }
                while (ch >= '0' && ch <= '9') {
                    string += ch;
                    next();
                }
            }
            number = +string;
            if (!isFinite(number)) {
                error("Bad number");
            } else {
                return number;
            }
        },

        string = function () {

// Parse a string value.

            var hex,
                i,
                string = '',
                uffff;

// When parsing for string values, we must look for " and \ characters.

            if (ch === '"') {
                while (next()) {
                    if (ch === '"') {
                        next();
                        return string;
                    }
                    if (ch === '\\') {
                        next();
                        if (ch === 'u') {
                            uffff = 0;
                            for (i = 0; i < 4; i += 1) {
                                hex = parseInt(next(), 16);
                                if (!isFinite(hex)) {
                                    break;
                                }
                                uffff = uffff * 16 + hex;
                            }
                            string += String.fromCharCode(uffff);
                        } else if (typeof escapee[ch] === 'string') {
                            string += escapee[ch];
                        } else {
                            break;
                        }
                    } else {
                        string += ch;
                    }
                }
            }
            error("Bad string");
        },

        white = function () {

// Skip whitespace.

            while (ch && ch <= ' ') {
                next();
            }
        },

        word = function () {

// true, false, or null.

            switch (ch) {
            case 't':
                next('t');
                next('r');
                next('u');
                next('e');
                return true;
            case 'f':
                next('f');
                next('a');
                next('l');
                next('s');
                next('e');
                return false;
            case 'n':
                next('n');
                next('u');
                next('l');
                next('l');
                return null;
            }
            error("Unexpected '" + ch + "'");
        },

        value,  // Place holder for the value function.

        array = function () {

// Parse an array value.

            var array = [];

            if (ch === '[') {
                next('[');
                white();
                if (ch === ']') {
                    next(']');
                    return array;   // empty array
                }
                while (ch) {
                    array.push(value());
                    white();
                    if (ch === ']') {
                        next(']');
                        return array;
                    }
                    next(',');
                    white();
                }
            }
            error("Bad array");
        },

        object = function () {

// Parse an object value.

            var key,
                object = {};

            if (ch === '{') {
                next('{');
                white();
                if (ch === '}') {
                    next('}');
                    return object;   // empty object
                }
                while (ch) {
                    key = string();
                    white();
                    next(':');
                    if (Object.hasOwnProperty.call(object, key)) {
                        error('Duplicate key "' + key + '"');
                    }
                    object[key] = value();
                    white();
                    if (ch === '}') {
                        next('}');
                        return object;
                    }
                    next(',');
                    white();
                }
            }
            error("Bad object");
        };

    value = function () {

// Parse a JSON value. It could be an object, an array, a string, a number,
// or a word.

        white();
        switch (ch) {
        case '{':
            return object();
        case '[':
            return array();
        case '"':
            return string();
        case '-':
            return number();
        default:
            return ch >= '0' && ch <= '9' 
                ? number() 
                : word();
        }
    };

// Return the json_parse function. It will have access to all of the above
// functions and variables.

    return function (source, reviver) {
        var result;

        text = source;
        at = 0;
        ch = ' ';
        result = value();
        white();
        if (ch) {
            error("Syntax error");
        }

// If there is a reviver function, we recursively walk the new structure,
// passing each name/value pair to the reviver function for possible
// transformation, starting with a temporary root object that holds the result
// in an empty key. If there is not a reviver function, we simply return the
// result.

        return typeof reviver === 'function'
            ? (function walk(holder, key) {
                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }({'': result}, ''))
            : result;
    };
}());

var Mustache = function (template) {
    function Token(type, value, start, end) {
        this.type = type;
        this.value = value;
        this.start = start;
        this.end = end;
    }
    Token.prototype.getType = function () { return this.type};
    Token.prototype.setType = function (type) { this.type = type};
    Token.prototype.getValue = function () { return this.value};
    Token.prototype.setValue = function (value) { this.value = value};
    Token.prototype.getStart = function () { return this.start};
    Token.prototype.getEnd = function () { return this.end};
    Token.prototype.toString = function () { return "<"+this.type + ", " + this.value + ">"};
    
    function Lexer(template) {
        this.textMode = false;
        this.at = 0;
        this.text = template || "";
        this.tags = ["{{", "}}"];
    };
    Lexer.prototype.nextToken = function () {
        function textBlock (lex) {
            var index, value, start = lex.at;
            index = lex.text.indexOf(lex.tags[0], start);
            if (index === -1) { index = lex.text.length;}
            value = lex.text.slice(start, index);
            lex.at = index + lex.tags[0].length;
            return new Token("text", value, start, start + value.length);
        }
        function codeBlock (lex) {
            var index, value, start = lex.at;
            index = lex.text.indexOf(lex.tags[1], start);
            if (index === -1) { throw new Error("close tag not found: " + start);}
            value = lex.text.slice(start, index);
            lex.at = index + lex.tags[1].length;
            switch (value.charAt(0)) {
            case "=":
                if (lex.text.charAt(lex.at) === "\r") { lex.at += 1;}
                if (lex.text.charAt(lex.at) === "\n") { lex.at += 1;}
                return new Token("delimiter", value, start, start + value.length);
            case "!":
                if (lex.text.charAt(lex.at) === "\r") { lex.at += 1;}
                if (lex.text.charAt(lex.at) === "\n") { lex.at += 1;}
                return new Token("comment", value.slice(1), start, start + value.length);
            case "#":
                if (lex.text.charAt(lex.at) === "\r") { lex.at += 1;}
                if (lex.text.charAt(lex.at) === "\n") { lex.at += 1;}
                return new Token("section", value.slice(1), start, start + value.length);
            case "^":
                if (lex.text.charAt(lex.at) === "\r") { lex.at += 1;}
                if (lex.text.charAt(lex.at) === "\n") { lex.at += 1;}
                return new Token("inverted", value.slice(1), start, start + value.length);
            case "/":
                if (lex.text.charAt(lex.at) === "\r") { lex.at += 1;}
                if (lex.text.charAt(lex.at) === "\n") { lex.at += 1;}
                return new Token("close", value.slice(1), start, start + value.length);
            case "@":
                if (lex.text.charAt(lex.at) === "\r") { lex.at += 1;}
                if (lex.text.charAt(lex.at) === "\n") { lex.at += 1;}
                return new Token("include", value.slice(1), start, start + value.length)
            default:
                return new Token("variable", value, start, start + value.length);
            }
        }
        
        if (this.at >= this.text.length) {
            return new Token("EOF", "", this.at, this.text.length);
        }
        this.textMode = !this.textMode;
        if (this.textMode) {
            return textBlock(this);
        } else {
            return codeBlock(this);
        }
    };
    
    function Node(token) {
        this.token = token;
        this.children = [];
    }
    Node.prototype.getStart = function () { return this.token.getStart()};
    Node.prototype.getType = function () { return this.token.getType()};
    Node.prototype.setType = function (type) { this.token.setType(type)};
    Node.prototype.getValue = function () { return this.token.getValue()};
    Node.prototype.setValue = function (value) { this.token.setValue(value)};
    Node.prototype.push = function (child) { this.children.push(child)};
    Node.prototype.pop = function () { return this.children.pop()};
    Node.prototype.length = function () { return this.children.length};
    Node.prototype.head = function () { return this.children[0]};
    Node.prototype.tail = function () { return this.children[this.children.length - 1]};
    Node.prototype.item = function (i) { return this.children[i]};
    Node.prototype.toString = function () { return this.token.toString()};
    Node.prototype.toStringTree = function () { 
        var buf, i, len;
        if (this.children.length !== 0) {
            buf = [];
            for (i = 0, len = this.children.length; i < len; i++) {
                buf.push(this.children[i].toStringTree());
            }
            return "(" + this.token.type + ":" + this.token.value + " " + buf.join(" ") + ")";
        } else {
            return "(" + this.token.type + ":" + this.token.value + ")";
        }
    };
    
    function Parser () { }
    Parser.prototype.parse = function (lexer) {
        var root = new Node(new Token("root", ".", 0, 0)),
            context = root,
            reTags = /^=(.+)\s+(.+)=$/, // {{=tagL tagR=}}
            node,
            stack = [];
        
        node = new Node(lexer.nextToken());
        while (node.getType() !== "EOF") {
            switch(node.getType()) {
            case "EOF":
            case "comment":
                break;
            case "delimiter":
                if (!reTags.test(node.getValue())) { throw new Error("unrecognized delimiter: " + value);}
                lexer.tags = reTags.exec(node.getValue()).slice(1); // [tagL, tagR]
                break;
            case "section":
            case "inverted":
                stack.push(context);
                context.push(node);
                context = node;
                break;
            case "close":
                if (context.getValue() !== node.getValue() || !stack.length) {
                    throw new Error("invalid close tag at " + node.getStart());
                }
                context = stack.pop();
                break;
            case "include":
            case "variable":
            case "text":
                context.push(node);
                break;
            default:
                throw new Error("unrecognized token: " + node.getType());
            }
            node = new Node(lexer.nextToken());
        }
        return root;
    }
    
    function Visitor () {}
    Visitor.prototype.evalate = function (analysed_template, data) {
        var i, len,
            buf = [], 
            node = analysed_template,
            context = node;
        
        for (i = 0, len = context.length(); i < len; i++) {
            node = context.item(i);
            switch(node.getType()){
            case "inverted": buf.push(this.inverted(node, data)); break;
            case "section": buf.push(this.section(node, data)); break;
            case "variable": buf.push(this.variable(node, data)); break;
            case "include": buf.push(this.include(node)); break;
            case "text": buf.push(node.getValue()); break;
            default: throw new Error("unrecognized token: " + node.getType());
            }
        }
        return buf.join("");
    }
    Visitor.prototype.include = function (context) {
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var path = fso.GetAbsolutePathName(context.getValue());
        if (fso.FileExists(path)) {
            return fso.OpenTextFile(path).ReadAll();
        } else {
            throw new Error("file not found: " + path);
        }
    }
    Visitor.prototype.section = function (context, data) {
        var buf = [], i, len,
            value = context.getValue();
        
        if (data[value] === void 0) { data[value] = false; }
        
        switch(Object.prototype.toString.call(data[value]).slice(8,-1)){
        case "Boolean":
            if (data[value]) { buf.push(this.evalate(context, data))}
            break;
        case "Array":
            for (i = 0, len = data[value].length; i < len; i++) {
                buf.push(this.evalate(context, data[value][i]));
            }
            break;
        case "Object":
            buf.push(this.evalate(context, data[value]));
            break;
        case "String":
        case "Number":
            buf.push(this.evalate(context, data[value]));
            break;
        case "RegExp":
        case "Function":
            throw new Error("section error: " + value);
        }
        return buf.join("");
    }
    Visitor.prototype.inverted = function (context, data) {
        var buf = [],
            value = context.getValue();
        switch(Object.prototype.toString.call(data[value]).slice(8, -1)) {
        case "Boolean":
            if (!data[value]) { buf.push(this.evalate(context, data)); }
            break;
        }
        return buf.join("");
    }
    Visitor.prototype.variable = function (context, data) {
        var accessor = context.getValue(),
            dot, ret, i, len;
        
        if (accessor === ".") { return data;}
        
        dot = accessor.split(".");
        ret = data;
        for(i = 0, len = dot.length; i < len; i++) {
            if (ret[dot[i]] === void 0) { ret = ""; break;}
            ret = ret[dot[i]];
        }
        return ret;
    }
    
    var lexer, parser, analysed_template;
    lexer = new Lexer(template);
    parser = new Parser();
    analysed_template = parser.parse(lexer);
    
    return {
        cache: analysed_template,
        visitor: new Visitor(),
        eval: function (data) { return this.visitor.evalate(this.cache, data); }
    };
};
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
function echo(m) { WScript.Echo(m); } // print debug

// parse options
var arg, i, len;
for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
    case "/?": case "/help":
        view("Usage");
        WScript.Quit(0);
    case "/version":
        view("Version");
        WScript.Quit(0);
    default:
        error("mustache: invalid arguments. '" + arg + "'")
    }
}

// parse arguments
var template_path, data_path;
if (i < len) {
    template_path = WScript.Arguments(i);
    i++;
} else {
    error("mustache: specify a template.");
}
data_path = [];
for (; i < len; i++) {
    data_path.push(WScript.Arguments(i));
}

// check arguments
var fso = new ActiveXObject("Scripting.FileSystemObject");
if (!fso.FileExists(fso.GetAbsolutePathName(template_path))) {
    error("mustache: invalid template path. '" + template_path + "'");
}
if (data_path.length === 0) {
    error("mustache: specify at least one data file.")
}

// execute
var path, json_text, json, text, mustache;
path = fso.GetAbsolutePathName(template_path)
mustache = Mustache(fso.OpenTextFile(path).ReadAll());
for (i = 0, len = data_path.length; i < len; i++) {
    path = data_path[i];
    if (!fso.FileExists(fso.GetAbsolutePathName(path))) {
        WScript.StdErr.WriteLine("mustache: file not found. '" + path + "'");
        continue;
    }
    json_text = fso.OpenTextFile(fso.GetAbsolutePathName(path)).ReadAll();
    json = json_parse(json_text);
    text = mustache.eval(json);
    WScript.StdOut.WriteLine(text);
}
