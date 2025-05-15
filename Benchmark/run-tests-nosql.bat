@echo off
echo.
echo Running NoSQL Backend Benchmark...
newman run collection.json -e env-nosql.json --iteration-count 50 --reporters cli,json --reporter-json-export nosql_result.json

echo.
echo Benchmark complete. Results saved to nosql_result.json
pause
