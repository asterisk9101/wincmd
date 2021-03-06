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

- basename
- cat
- cut
- dirname
- each(簡易xargs)
- grep(findstr)
- head
- iconv
- init(wincmd\binをPATHに追加する)
- ll(dir | findstr "^2")
- ls(dir /b)
- mkdate(日付を生成して標準出力に流す)
- msort(sortの代替)
- mustache
- paste
- ps(tasklist)
- pwd(cd)
- rendate(ファイル名に最終更新日付yyyymmddを付与する)
- sed
- seq
- sleep(ping)
- tail
- tee
- tr
- uniq
- wc
- which
- xargs
- xl2csv(エクセルフォーマットからデータを取り出すツール)

# 作りかけ

- awk(きっと永遠に作りかけ)

# 作りたい
- grep
- find
- make
- jq
- csv を見やすく表示するツール
- csv に対して sql を発行するツール
- csv を join するツール
- xml と json を相互変換するツール
- 日付を生成・計算するツール
- cowsay
