@echo off

if "%~1"=="" goto :USAGE

:MAIN
set COMMAND=%*
for /f "usebackq tokens=*" %%o in (`findstr .*`) do (
        call %%COMMAND:?=%%o%%
)
goto :eof

:USAGE
echo �W�����͂̊e�s�ɑ΂��A�R�}���h�𔭍s���܂�
echo  each �R�}���h
echo   ���W�����͕͂ϐ�?�ƂȂ�܂�
goto :eof
