@echo off
echo Running SQL Backend Benchmark...
newman run collection.json -e env-sql.json --iteration-count 50 --reporters cli,json --reporter-json-export sql_result.json

echo.
echo Benchmark complete. Results saved to sql_result.json
pause
