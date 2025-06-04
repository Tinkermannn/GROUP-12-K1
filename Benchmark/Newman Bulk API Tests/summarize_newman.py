import json
from statistics import mean

def summarize_newman_report(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)

    stats = {
        "total_requests": 0,
        "passed_requests": 0,
        "failed_requests": 0,
        "passed_assertions": 0,
        "failed_assertions": 0,
        "response_times": {},
    }

    for run in data.get("run", {}).get("executions", []):
        stats["total_requests"] += 1

        assertions = run.get("assertions", [])
        failed = any(test.get("error") for test in assertions)
        if failed:
            stats["failed_requests"] += 1
        else:
            stats["passed_requests"] += 1

        # Count assertions
        for test in assertions:
            if test.get("error"):
                stats["failed_assertions"] += 1
            else:
                stats["passed_assertions"] += 1

        # Collect response time by request name
        name = run.get("item", {}).get("name", "unknown")
        time = run.get("response", {}).get("responseTime", 0)
        stats["response_times"].setdefault(name, []).append(time)

    print(f"Summary for: {file_path}")
    print(f"Total Requests: {stats['total_requests']}")
    print(f"Passed Requests: {stats['passed_requests']}")
    print(f"Failed Requests: {stats['failed_requests']}")
    print(f"Passed Assertions: {stats['passed_assertions']}")
    print(f"Failed Assertions: {stats['failed_assertions']}")
    print("\nAverage Response Times (ms):")
    for req_name, times in stats["response_times"].items():
        avg_time = mean(times)
        print(f"  {req_name}: {avg_time:.2f}")
    print("-" * 40)

if __name__ == "__main__":
    # Change filenames here if needed
    summarize_newman_report("sql_result.json")
    summarize_newman_report("nosql_result.json")