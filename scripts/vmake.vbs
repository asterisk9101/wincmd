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
                ' 未実装
            case "doxygen"
                ' 未実装
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
        ''' 読み込んだ行が require コメント('!require で始まるコメント)だった場合、要求されたファイルを探索して読み込む。
        ''' 読み込んだファイルに require コメントが存在した場合、再帰的に読み込みを繰り返す。
        ''' 第一引数 line として、現在読み込んでいる行 (String) を受け取る。
        ''' 第二引数 entry として、探索されるファイル名 (String) を受け取る。
        ''' 戻り値は返さない。
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
        ''' フォルダを再帰的に検索し、指定されたファイルのフルパスを取得する。
        ''' 発見したファイルが既にマージされている場合は "loaded" (String) を返す。
        ''' ファイルが見つからない場合は "not found" (String) を返す。
        ''' 第一引数 moduleName として、探索するファイル名 (String) を受け取る。
        ''' 第二引数 path として、探索するフォルダのパス (String) を受け取る。
        ''' 戻り値として、発見したファイルのフルパス (String) を返す。
        
        traversal = "not found"
        
        ' 深さ優先で探索する
        dim folder, item
        set folder = fso.getFolder(path)
        for each item in folder.subfolders
            if checkFolderType(item) then
                traversal = traversal(moduleName, lcase(item.path))
                ' 発見したか、既に発見していた場合は即座に探索を中止する。
                if traversal = "loaded" then exit function
                if fso.fileExists(traversal) then exit function
            end if
        next
        
        ' フォルダ内のファイルを検索する
        traversal = traversalFile(folder.files, moduleName)
    end function
    
    private function checkFolderType(byval folder)
        ''' フォルダが探索対象であるか判定する。
        ''' 第一引数 folder として、フォルダ (Folder) を受け取る。
        ''' 戻り値として、判定結果 (Boolean) を返す。
        checkFolderType = true
        if (folder.attributes and 2) = 2 then checkFolderType = false ' 隠し属性の場合は対象外
        if mid(folder.name, 1, 1) = "." then checkFolderType = false ' ドットで始まる名前のフォルダは対象外
    end function
    
    private function traversalFile(byval files, byval moduleName)
        ''' フォルダ内のファイルを検索する。
        ''' 目的のファイルを発見した場合は、そのファイルのフルパス (String) を返す。
        ''' 目的のファイルを発見できなかった場合は、"not found" (String) を返す。
        ''' 既に発見したファイルを再度見つけた場合は、"loaded" (String) を返す。
        ''' 第一引数 files として、ファイルのコレクション (Files) を受け取る
        ''' 第二引数 moduleName として、検索するファイル名 (String) を受け取る。
        ''' 戻り値として、発見したファイルのパス (String) を返す。
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
        ''' 既にモジュールが読み込まれているか判定する。
        ''' 第一引数 moduleName として、モジュール名 (String) を受け取る。
        ''' 戻り値として、判定結果 (Boolean) を返す。
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
        ''' VBS の一部として行を圧縮する。
        ''' クラス変数 min に設定された値が 0 のときは、何も処理せず行を返す。
        ''' クラス変数 min に設定された値が 1 のときは、コメント部分を削除した行を返す。
        ''' クラス変数 min に設定された値が 2 のときは、doxygenコメントを削除した行を返す。
        ''' クラス変数 min に設定された値が 3 以上のときは、全てのコメントとインデントと空白行を削除する。
        ''' 行が空文字列になった場合は null を返す。
        ''' 第一引数 line として、処理する行 (String) を受け取る。
        ''' 戻り値として、処理した行 (String or null) を返す。
        minify = line
        if isNull(line) then exit function
        if config.item("minify") = 0 then exit function
        
        dim level, tmp
        level = config.item("minify") 
        tmp = trim(line)
        
        if level > 0 then
            if left(tmp, 3) = "'''" then
                ' 何もしない
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
        ''' Option Explicit を削除する。
        ''' 削除を実行した場合は null を返す。
        ''' 戻り値として、ストリーム (String or null) を返す。
        options = line
        if isNull(line) then exit function
        if lcase(trim(line)) = "option explicit" then
            line = null
        end if
        options = line
    end function
end class

call (new vmake).main(WScript.Arguments)
