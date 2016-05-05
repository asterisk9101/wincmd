@echo off
set /a n=%1+1
ping /n %n% 127.0.0.1 > nul
