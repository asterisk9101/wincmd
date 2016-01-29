class ConfigLoader
    private fso
    private dom
    private root
    private index
    
    public function init(byval path)
        set fso = createObject("Scripting.FileSystemObject")
        set dom = createObject("MSXML.DOMDocument")
        
        if fso.fileExists(path) then
            if not dom.load(path) then
                call err.raise(12345, TypeName(me), "config file syntax error:" & path)
            end if
        else
            call dom.loadXML("<dummy></dummy>")
        end if
        
        set root = dom.documentElement
        index = 0
        set init = me
    end function
    
    public function nextConfig(byval container)
        dim node, attr
        set node = nothing
        do while index < root.childNodes.length
            set node = root.childNodes.item(index)
            index = index + 1
            if lcase(node.nodeName) = "unit" then exit do
        loop
        
        if node is nothing then
            set container = nothing
        else
            set container = setAttribute(container, node.attributes)
        end if
        
        set nextConfig = container
    end function
    
    private function setAttribute(byval container, byval attributes)
        dim attr
        for each attr in attributes
            select case lcase(attr.name)
            case "entry"
                call setEntry(container, attr.value)
            case "output"
                call setOutput(container, attr.value)
            case "loadpath"
                call setLoadPath(container, attr.value)
            case "minify"
                call setMinify(container, attr.value)
            case "test"
                call setTest(container, attr.value)
            case "sourcemap"
                ' ������
            case "doxygen"
                ' ������
            end select
        next
        set setAttribute = container
    end function
    
    private function setTest(byval container, byval path)
        if fso.fileExists(path) then
            container.item("test") = path
        end if
    end function
    
    private function setMinify(byval container, byval level)
        if isNumeric(level) then
             container.item("minify") = cint(level)
        end if
    end function
    
    private function setLoadPath(byval container, byval path)
        if fso.folderExists(path) then
            container.item("loadpath") = fso.getAbsolutePathName(path)
        end if
    end function
    
    private function setEntry(byval container, byval path)
        if not fso.fileExists(path) then call err.raise(12345)
        container.item("entry") = path
    end function
    
    private function setOutput(byval container, byval path)
        container.item("output") = path
    end function
end class

class vMake
    private fso
    private shell
    private loaded
    private re
    private config
    private output
    
    private sub Class_Initialize
        set fso = createObject("Scripting.FileSystemObject")
        set shell = createObject("WScript.Shell")
        set re = createObject("VBScript.RegExp")
        re.pattern = "^'!require\s+(.*)\s*$"
        re.ignoreCase = true
        set output = nothing
        call initConfig()
    end sub
    
    private function initConfig()
        set config = createObject("Scripting.Dictionary")
        
        config.item("path") = "vmake.config"
        config.item("minify") = 0
        config.item("loadpath") = shell.expandEnvironmentStrings("%loadpath%")
        config.item("entry") = ""
        config.item("output") = ""
        config.item("test") = ""
        if not fso.folderExists(config.item("loadpath")) then
            config.item("loadpath") = shell.currentDirectory
        end if
    end function
    
    public function main(byval args)
        dim loader
        set loader = (new ConfigLoader).init(config.item("path"))
        
        set config = loader.nextConfig(config)
        do until config is nothing
            call run()
            call initConfig()
            set config = loader.nextConfig(config)
        loop
    end function
    
    private function run()
        dim entry_conf, output_conf
        entry_conf = config.item("entry")
        output_conf = config.item("output")
        
        if not fso.fileExists(entry_conf) then
            call wscript.echo("entryfile not found: " & entry_conf)
            exit function
        end if
        if fso.getAbsolutePathName(entry_conf) = fso.getAbsolutePathName(output_conf) then
            call wscript.echo("entry and output are same file: " & vbcrlf & entry_conf & vbcrlf & output_conf)
            exit function
        end if
        
        set output = fso.openTextFile(output_conf, 2, true) ' for writing and create
        set loaded = createObject("System.Collections.ArrayList")
        call loaded.add(entry_conf)
        call loaded.add(output_conf)
        
        call merge(entry_conf)
        
        dim test_code
        if fso.fileExists(config.item("test")) then
            set test_code = fso.openTextFile(config.item("test")) ' for readinag
            do until test_code.atEndOfStream
                call output.writeLine(test_code.readLine())
            loop
            call test_code.close()
        end if
        
        call output.close()
    end function
    
    private function merge(byval file)
        dim stream, line
        set stream = fso.openTextFile(file)
        do until stream.atEndOfStream
            line = stream.readLine()
            line = require(line, file)
            line = minify(line)
            line = options(line)
            if not isNull(line) then
                call output.writeLine(line)
            end if
        loop
        call stream.close()
    end function
    
    private function require(byval line, byval file)
        ''' �ǂݍ��񂾍s�� require �R�����g('!require �Ŏn�܂�R�����g)�������ꍇ�A�v�����ꂽ�t�@�C����T�����ēǂݍ��ށB
        ''' �ǂݍ��񂾃t�@�C���� require �R�����g�����݂����ꍇ�A�ċA�I�ɓǂݍ��݂��J��Ԃ��B
        ''' ������ line �Ƃ��āA���ݓǂݍ���ł���s (String) ���󂯎��B
        ''' ������ entry �Ƃ��āA�T�������t�@�C���� (String) ���󂯎��B
        ''' �߂�l�͕Ԃ��Ȃ��B
        require = line
        if isNull(line) then exit function
        
        dim mc, name, fullpath
        set mc = re.execute(line)
        if mc.count > 0 then
            require = null
            name = mc.item(0).submatches.item(0)
            
            fullpath = traversal(lcase(name), lcase(config.item("loadpath")))
            select case fullpath
            case "not found"
                call wscript.echo(file & " require '" & name & "', however '" & name & "' is not found.")
            case "loaded"
                ' msgbox "loaded: " & name
            case else
                call merge(fullpath)
                call output.writeLine("")
            end select
        end if
    end function
    
    public function traversal(byval moduleName, byval path)
        ''' �t�H���_���ċA�I�Ɍ������A�w�肳�ꂽ�t�@�C���̃t���p�X���擾����B
        ''' ���������t�@�C�������Ƀ}�[�W����Ă���ꍇ�� "loaded" (String) ��Ԃ��B
        ''' �t�@�C����������Ȃ��ꍇ�� "not found" (String) ��Ԃ��B
        ''' ������ moduleName �Ƃ��āA�T������t�@�C���� (String) ���󂯎��B
        ''' ������ path �Ƃ��āA�T������t�H���_�̃p�X (String) ���󂯎��B
        ''' �߂�l�Ƃ��āA���������t�@�C���̃t���p�X (String) ��Ԃ��B
        
        traversal = "not found"
        
        ' �[���D��ŒT������
        dim folder, item
        set folder = fso.getFolder(path)
        for each item in folder.subfolders
            if checkFolderType(item) then
                traversal = traversal(moduleName, lcase(item.path))
                ' �����������A���ɔ������Ă����ꍇ�͑����ɒT���𒆎~����B
                if traversal = "loaded" then exit function
                if fso.fileExists(traversal) then exit function
            end if
        next
        
        ' �t�H���_���̃t�@�C������������
        traversal = traversalFile(folder.files, moduleName)
    end function
    
    private function checkFolderType(byval folder)
        ''' �t�H���_���T���Ώۂł��邩���肷��B
        ''' ������ folder �Ƃ��āA�t�H���_ (Folder) ���󂯎��B
        ''' �߂�l�Ƃ��āA���茋�� (Boolean) ��Ԃ��B
        checkFolderType = true
        if (folder.attributes and 2) = 2 then checkFolderType = false ' �B�������̏ꍇ�͑ΏۊO
        if mid(folder.name, 1, 1) = "." then checkFolderType = false ' �h�b�g�Ŏn�܂閼�O�̃t�H���_�͑ΏۊO
    end function
    
    private function traversalFile(byval files, byval moduleName)
        ''' �t�H���_���̃t�@�C������������B
        ''' �ړI�̃t�@�C���𔭌������ꍇ�́A���̃t�@�C���̃t���p�X (String) ��Ԃ��B
        ''' �ړI�̃t�@�C���𔭌��ł��Ȃ������ꍇ�́A"not found" (String) ��Ԃ��B
        ''' ���ɔ��������t�@�C�����ēx�������ꍇ�́A"loaded" (String) ��Ԃ��B
        ''' ������ files �Ƃ��āA�t�@�C���̃R���N�V���� (Files) ���󂯎��
        ''' ������ moduleName �Ƃ��āA��������t�@�C���� (String) ���󂯎��B
        ''' �߂�l�Ƃ��āA���������t�@�C���̃p�X (String) ��Ԃ��B
        traversalFile = "not found"
        dim item, path
        for each item in files
            path = lcase(item.path)
            if right(path, len(moduleName)) = moduleName then
                if checkLoaded(path) then
                    traversalFile = "loaded"
                else
                    call loaded.add(path)
                    traversalFile = path
                end if
                exit for
            end if
        next
    end function
    
    private function checkLoaded(byval moduleName)
        ''' ���Ƀ��W���[�����ǂݍ��܂�Ă��邩���肷��B
        ''' ������ moduleName �Ƃ��āA���W���[���� (String) ���󂯎��B
        ''' �߂�l�Ƃ��āA���茋�� (Boolean) ��Ԃ��B
        checkLoaded = false
        dim path
        for each path in loaded
            path = right(path, len(moduleName))
            if path = moduleName then
                checkLoaded = true
                exit for
            end if
        next
    end function
    
    private function minify(byval line)
        ''' VBS �̈ꕔ�Ƃ��čs�����k����B
        ''' �N���X�ϐ� min �ɐݒ肳�ꂽ�l�� 0 �̂Ƃ��́A�������������s��Ԃ��B
        ''' �N���X�ϐ� min �ɐݒ肳�ꂽ�l�� 1 �̂Ƃ��́A�R�����g�������폜�����s��Ԃ��B
        ''' �N���X�ϐ� min �ɐݒ肳�ꂽ�l�� 2 �̂Ƃ��́Adoxygen�R�����g���폜�����s��Ԃ��B
        ''' �N���X�ϐ� min �ɐݒ肳�ꂽ�l�� 3 �ȏ�̂Ƃ��́A�S�ẴR�����g�ƃC���f���g�Ƌ󔒍s���폜����B
        ''' �s���󕶎���ɂȂ����ꍇ�� null ��Ԃ��B
        ''' ������ line �Ƃ��āA��������s (String) ���󂯎��B
        ''' �߂�l�Ƃ��āA���������s (String or null) ��Ԃ��B
        minify = line
        if isNull(line) then exit function
        if config.item("minify") = 0 then exit function
        
        dim level, tmp
        level = config.item("minify") 
        tmp = trim(line)
        
        if level > 0 then
            if left(tmp, 3) = "'''" then
                ' �������Ȃ�
            elseif left(tmp, 1) = "'" then
                minify = null
                exit function
            end if
        end if
        
        if level > 1 then
            if left(tmp, 3) = "'''" then
                minify = null
                exit function
            end if
        end if
        
        if level > 2 then
            if tmp = "" then tmp = null
            minify = tmp
            exit function
        end if
    end function
    
    private function options(byval line)
        ''' Option Explicit ���폜����B
        ''' �폜�����s�����ꍇ�� null ��Ԃ��B
        ''' �߂�l�Ƃ��āA�X�g���[�� (String or null) ��Ԃ��B
        options = line
        if isNull(line) then exit function
        if lcase(trim(line)) = "option explicit" then
            line = null
        end if
        options = line
    end function
end class

call (new vmake).main(WScript.Arguments)
