// [Usage]
// ���O
//     tr - �����̕ϊ��E�폜��A�A�����镶���̈��k���s��  
// 
// ����
//     tr [/c] [/complement] [/d] [/delete] [/s] [/squeeze-repeats] SET1 [SET2]
//     tr [/?] [/help] [/v] [/version]
// 
// ����
//     tr �́A�W�����͂���ǂݍ��񂾕�����u���A�؂�l�߁A�폜���A�W���o�͂ɏ������݂܂��B
// 
// �I�v�V����
//     /c, /complement
//         SET1 ��(ascii������)��W�����g�p����B
// 
//     /d, /delete
//         SET1 ���̕������폜����B�u���͍s��Ȃ��B
// 
//     /s, /squeeze-repeats
//         ���͂̒��� SET1 �Ɋ܂܂�镶�����A�����đ��݂���ꍇ�� 1 �ɒu������B
// 
//     /?, /help
//         �W���o�͂Ɏg�p���@�̃��b�Z�[�W���o�͂��Đ���I������B
// 
//     /version
//         �W���o�͂Ƀo�[�W���������o�͂��Đ���I������B
// 
// SET1,SET2 �̎w��
//     \NNN ������ 8 �i���\��(1����3��8�i��)
// 
//     \\   �o�b�N�X���b�V��
// 
//     \a   �x��
// 
//     \b   �o�b�N�X�y�[�X
// 
//     \f   �t�H�[���t�B�[�h
// 
//     \n   ���s
// 
//     \r   ���A
// 
//     \t   �����^�u
// 
//     \v   �����^�u
// 
//     CHAR1-CHAR2
//          CHAR1 ���� CHAR2 �܂ł������ɓW�J����������
// 
//     [:alnum:]
//          �S�ẴA���t�@�x�b�g�Ɛ���
// 
//     [:alpha:]
//          �S�ẴA���t�@�x�b�g
// 
//     [:blank:]
//          �X�y�[�X�Ɛ����^�u
// 
//     [:cntrl:]
//          �S�Ă̐��䕶��
// 
//     [:digit:]
//          �S�Ă̐���
// 
//     [:graph:]
//          �S�Ă̕\���\�����i�󔒂��܂܂Ȃ��j�B
// 
//     [:lower:] 
//          �S�Ă̏������A���t�@�x�b�g�B
// 
//     [:print:]
//          �S�Ă̕\���\�����i�󔒂��܂ށj�B
// 
//     [:punct:]
//          �S�Ă̋�Ǔ_�i�L���j�B
// 
//     [:space:]
//          �S�Ă̐����^�u�Ɛ����^�u�����B
// 
//     [:upper:]
//          �S�Ă̑啶���A���t�@�x�b�g�B
// 
//     [:xdigit:]
//          �S�Ă�16�i�����l
// 
// ��ʓI�� tr �Ƃ̍���
//     SET1 �� SET2 �̒����ɍ��ق�����ꍇ�ł��G���[���o�͂��܂���B
//     �]���� truncate �I�v�V�����͂���܂���B
// 
//     [CHAR*] �L�@�͔�Ή��ł��B
// 
//     [=CHAR=] �L�@�͔�Ή��ł��B
// 
//     �����N���X�̎g�p�ɐ����͂���܂���BSET2 �ł��S�Ďg�p�ł��܂��B
// 

// [Version]
// tr.vbs version 0.1

var prog_name = "tr";

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
        WScript.StdErr.WriteLine(prog_name + ": arguments error");
        WScript.Quit(1);
    }
}
function echo(m) {
    WScript.Echo(m);
}
function tr(opts, SET1, SET2){
    function parse_set(SET) {
        function oct() {
            var u888 = 0, i, oct;
            for (i = 0; i < 3; i++) {
                oct = parseInt(ch, 16);
                if (!isFinite(oct)) { break; }
                u888 = (u888 * 8) + oct;
                next();
            }
            return String.fromCharCode(u888);
        }
        function escape() {
            switch(next()){
            case "a": return "\a";
            case "b": return "\b";
            case "f": return "\f";
            case "r": return "\r";
            case "n": return "\n";
            case "t": return "\t";
            case "v": return "\v";
            case "\\": return "\\";
            default:
                if (isFinite(ch)) {
                    return oct();
                } else {
                    throw new Error();
                }
            }
        }
        function alnumClass() {
            return "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
        };
        function alphaClass() {
            return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
        }
        function blankClass() {
            return [" ", "\t"];
        }
        function cntrlClass() {
            var buf = [], i;
            for(i = 0; i < 33; i++) {
                buf.push(String.fromCharCode(i));
            }
            return buf;
        }
        function digitClass() {
            return "0123456789".split("");
        }
        function graphClass() {
            var buf = [], i;
            for(i = 33; i < 127; i++){
                buf.push(String.fromCharCode(i));
            }
            return buf;
        }
        function lowerClass() {
            return "abcdefghijklmnopqrstuvwxyz".split("");
        }
        function printClass() {
            var buf = [], i;
            for(i = 32; i < 127; i++){
                buf.push(String.fromCharCode(i));
            }
            return buf;
        }
        function punctClass() {
            return "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~".split("");
        }
        function spaceClass() {
            return " \t".split("");
        }
        function upperClass() {
            return " \t\n\x0B\f\r".split("");
        }
        function xdigitClass() {
            return "0123456789abcdefABCDEF".split("");
        }
        function charClass() {
            var buf = [];
            while(true){
                if (ch === "") { return buf; }
                if (ch === ":") {
                    next();
                    if (ch === "]") { break; }
                    buf.push(":");
                    buf.push(ch);
                } else {
                    buf.push(ch);
                }
                next();
            }
            switch(buf.join("")){
            case "alnum": return alnumClass();
            case "alpha": return alphaClass();
            case "blank": return blankClass();
            case "cntrl": return cntrlClass();
            case "digit": return digitClass();
            case "graph": return graphClass();
            case "lower": return lowerClass();
            case "print": return printClass();
            case "punct": return punctClass();
            case "space": return spaceClass();
            case "upper": return upperClass();
            case "xdigit": return xdigitClass();
            default: throw new Error("invalid character class. '" + buf.join("") + "'");
            }
        }
        function range(start) {
            var list = [];
            var start_code = start.charCodeAt(start);
            var end_code = next().charCodeAt(0);
            if (start_code > end_code) { throw new Error(); }
            var i = start_code;
            for (; i <= end_code; i++) {
                list.push(String.fromCharCode(i));
            }
            return list;
        }
        function next() {
            at++;
            ch = SET.charAt(at);
            return ch;
        }
        var at, ch, list;
        at = 0;
        ch = SET.charAt(at);
        list = [];
        while(ch !== "") {
            switch(ch){
            case "[":
                next();
                if (ch === ":") {
                    next();
                    list = list.concat(charClass());
                } else {
                    list.push("[");
                    list.push(ch);
                }
                break;
            case "-":
                list = list.concat(range(list.pop()));
                break;
            case "\\":
                list.push(escape());
                break;
            default:
                list.push(ch);
                break;
            }
            next();
        }
        return list;
    }
    function complement(set_list) {
        var buf = [], i, j, len, hit;
        len = set_list.length;
        for(i = 0; i < 128; i++) {
            ch = String.fromCharCode(i);
            hit = false;
            for(j = 0; j < len; j++) {
                if (set_list[j] === ch) {
                    hit = true; break;
                }
            }
            if (!hit) { buf.push(ch); }
        }
        return buf;
    }
    var i, len1, len2, ch, index, tail, before;
    var set1 = parse_set(SET1);
    var set2 = parse_set(SET2 || "");
    tail = set2[set2.length - 1];
    
    if (opts.complement) {
        set1 = complement(set1);
    }
    len1 = set1.length;
    len2 = set2.length;
    while(!WScript.StdIn.AtEndOfStream) {
        ch = WScript.StdIn.Read(1);
        index = -1;
        for(i = 0; i < len1; i++) {
            if (ch === set1[i]) { index = i; }
        }
        if (opts.del && index !== -1) { continue; }
        if (opts.squeeze && index !== -1 && before === ch) { continue; }
        before = ch;
        if (index > len2) { WScript.StdOut.Write(tail); continue; }
        if (index === -1) { WScript.StdOut.Write(ch); continue; }
        if (-1 < index && index < len2) { WScript.StdOut.Write(set2[index]); continue; }
        WScript.StdOut.Write(ch);
    }
}

// parse options
var arg, i, len, opts = {}, SET1, SET2;
for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg === "//") { break; }
    if (arg === "--") { break; }
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
    case "/dc":
    case "/cd":
        opts.complement = true;
        opts.del = true;
        break;
    case "/c":
    case "/complement":
        opts.complement = true;
        break;
    case "/d":
    case "/delete":
        opts.del = true;
        break;
    case "/s":
    case "/squeeze-repeats":
        opts.squeeze = true;
        break;
    case "/?":
    case "/help":
        view("Usage");
        WScript.Quit(0);
    case "/v":
    case "/version":
        view("Version");
        WScript.Quit(0);
    default:
        error(prog_name + ": invalid arguments. '" + arg + "'")
        break;
    }
}

// parse arguments
if (i < len) {
    SET1 = WScript.Arguments(i);
} else {
    throw new Error(prog_name + ": missing argument. 'SET1'");
}
if (!opts.del) {
    i++;
    SET2 = get_next_arg(i);
}

tr(opts, SET1, SET2);
