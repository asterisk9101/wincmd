@echo off

if "%~1"=="" goto :USAGE

:MAIN
set COMMAND=%*
for /f "usebackq tokens=*" %%o in (`findstr .*`) do (
        call %%COMMAND:?=%%o%%
)
goto :eof

:USAGE
echo 標準入力の各行に対し、コマンドを発行します
echo  each コマンド
echo   ※標準入力は変数?となります
goto :eof
