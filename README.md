**※必要が無ければこのコマンド群を使用しないでください。これらに相当するコマンド群は Powershell に含まれています。**

# WinCmd

Windows標準機能(.NET含む)で、コマンドプロンプトからLinuxっぽいコマンドを使えるようにします。

`git clone` してから PATH に wincmd\bin を追加してください。

```
cd C:\
git clone https://github.com/asterisk9101/wincmd.git
set PATH=C:\wincmd\bin;%PATH%
```

もしくは `wincmd/bin/init.bat` を実行すると、PATH に wincmd\bin が追加されます。

大抵のコマンドは `/?` でヘルプが表示できます。


# 作った

- head
- tail
- seq
- tee
- sleep
- uniq
- cut
- sed
- wc
- which
- mustache
- dirname
- basename
- each(簡易xargs)
- cat(type)
- ls(dir /b)
- ll(dir | findstr "^2")
- ps(tasklist)
- pwd(cd)
- grep(findstr)
- init(wincmd\binをPATHに追加する)
- rendate(ファイル名に最終更新日付yyyymmddを付与する)
- mkdate(日付を生成して標準出力に流す)

# 作りかけ

- awk(きっと永遠に作りかけ)

# 作りたい
- tr
- sort
- grep
- find
- xargs
- make
