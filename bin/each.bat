@echo off

set COMMAND=%*
for /f "usebackq tokens=*" %%o in (`findstr .*`) do (
        call %%COMMAND:?=%%o%%
)
