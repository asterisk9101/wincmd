// [Usage]
// ���O
//     cat - �t�@�C����A�����ďo�͂���  
// 
// ����
//     cat [/A] [/show-all] [FILE...]
//     cat [/version] [/help]
// 
// ����
//     cat �͎w�肵���t�@�C�����ꂼ��̓��e��W���o�͂֏����o���B
//     FILE ������^�����Ȃ��ƕW�����͂���ǂݍ��ށB
//     �܂� FILE �� `-' �������ꍇ�ɂ́A���̃t�@�C���ɂ͕W�����͂��p������B  
// 
// OPTION
//     /A, /show-all
//         ���䕶����\������B
// 
//     /?, /help
//         �I�v�V�����ɂ��ĊȒP�ɐ���������I������B
// 
//     /v, /version
//         �o�[�W�����ԍ���\�����Đ���I������B
// 

// [Version]
// cat.js version 0.1a

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
        WScript.StdErr.WriteLine("xargs: arguments error");
        WScript.Quit(1);
    }
}
function echo(m) {
    WScript.Echo(m);
}

function cat(opts, files){
    function control_char(ch){
        switch(ch.charCodeAt(0)){
        case 9: ch = "^I"; break; // tab
        case 10: ch = "$\n"; break; // new line
        default: ch = ch.charCodeAt(0) < 32 ? ch = "^M" : ch; break;
        }
        return ch;
    }
    function read(opts, stream){
        var ch;
        if (opts.show_all) {
            while(!stream.AtEndOfSteam){
                ch = stream.Read(1);
                ch = control_char(ch);
                WScript.StdOut.Write(ch);
            }
        } else {
            WScript.StdOut.Write(stream.ReadAll());
        }
    }
    var file, i, len;
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    if (files.length === 0) {
        read(opts, WScript.StdIn)
    } else {
        for (i = 0, len = files.length; i < len; i++) {
            if (files[i] === "-") {
                read(opts, WScript.StdIn);
            } else {
                file = fso.OpenTextFile(files[i]);
                read(opts, file);
                file.Close();
            }
        }
    }
}

// parse options
var arg, i, len, opts = {}, files = [];
opts.show_all = false;
for(i = 0, len = WScript.Arguments.length; i < len; i++) {
    arg = WScript.Arguments(i);
    if (arg === "//") { break; }
    if (arg === "--") { break; }
    if (arg.charAt(0) !== "/") { break;}
    switch (arg) {
    case "/A":
    case "/show-all":
        opts.show_all = true;
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
        error("cat: invalid arguments. '" + arg + "'")
        break;
    }
}

// parse arguments
for(; i < len; i++) {
    files.push(WScript.Arguments(i));
}
cat(opts, files);
