@echo off
echo Executing database build script...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U ghgconnect_user -d ghgconnect_db -f database/complete_database_build.sql
echo Database build complete!
pause
