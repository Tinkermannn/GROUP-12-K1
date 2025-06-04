import requests
import time
import random
import string
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# --- Configuration ---
SQL_BASE_URL = "http://localhost:3000"
NOSQL_BASE_URL = "http://localhost:4000"
NUM_TEST_COURSES = 50 # Number of courses to create for this test

# --- Helper Functions (copied from performance_test.py for self-containment) ---
def generate_random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def generate_random_numeric_string(length=8):
    digits = string.digits
    return ''.join(random.choice(digits) for i in range(length))

def generate_user_data(random_id):
    username = f"user_loc_{random_id}"
    email = f"user_loc_{random_id}@example.com"
    return { "username": username, "email": email, "password": "Password123!", "role": "student" }

def generate_lecturer_data(random_id):
    return { "name": f"Dr. Loc {generate_random_string(5)}", "nidn": f"{generate_random_numeric_string(8)}", "department": "Computer Science" }

def generate_course_data(lecturer_id, random_id, capacity=100, prerequisites=None, for_nosql=False, lecturer_name=None, lecturer_department=None): # Added denormalized fields
    if prerequisites is None:
        prerequisites = []
    
    data = {
        "course_code": f"CLOC{random_id}",
        "name": f"Course Loc {random_id}",
        "credits": random.choice([2, 3, 4]),
        "semester": random.randint(1, 8),
        "capacity": capacity
    }
    if for_nosql:
        data["lecturerId"] = lecturer_id
        if lecturer_name: data["lecturerName"] = lecturer_name # Pass denormalized fields
        if lecturer_department: data["lecturerDepartment"] = lecturer_department # Pass denormalized fields
    else:
        data["lecturer_id"] = lecturer_id
    data["prerequisiteIds"] = prerequisites
    return data

def make_request(method, url, data=None, headers=None):
    start_time = time.perf_counter()
    response_time = 0
    status_code = 'N/A'
    response_json = {}
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=30)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=30)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
        else:
            raise ValueError("Unsupported HTTP method")

        response_time = (time.perf_counter() - start_time) * 1000
        status_code = response.status_code
        try:
            response_json = response.json()
        except json.JSONDecodeError:
            response_json = {"message": response.text}
        success = response.ok
        error_message = None
        if not success:
            error_message = response_json.get("message", response.text)
        return response_time, success, response_json, error_message, status_code
    except requests.exceptions.Timeout:
        response_time = (time.perf_counter() - start_time) * 1000
        return response_time, False, {"message": "Request timed out"}, "Request timed out", 'Timeout'
    except requests.exceptions.ConnectionError as e:
        response_time = (time.perf_counter() - start_time) * 1000
        return response_time, False, {"message": f"Connection error: {e}"}, f"Connection error: {e}", 'ConnectionError'
    except Exception as e:
        response_time = (time.perf_counter() - start_time) * 1000
        return response_time, False, {"message": f"An unexpected error occurred: {e}"}, f"An unexpected error occurred: {e}", 'UnknownError'

def get_id_from_response(response_json):
    if response_json:
        if response_json.get('payload') and (response_json['payload'].get('id') or response_json['payload'].get('_id')):
            return str(response_json['payload'].get('id') or response_json['payload'].get('_id'))
        elif response_json.get('data') and (response_json['data'].get('id') or response_json['data'].get('_id')):
            return str(response_json['data'].get('id') or response_json['data'].get('_id'))
        elif response_json.get('id') or response_json.get('_id'):
            return str(response_json.get('id') or response_json.get('_id'))
    return None

def run_test_scenario(scenario_name, base_url, method, endpoint, data_generator=None, num_requests=1, ids_to_use=None, **kwargs):
    results = []
    generated_ids = []
    print(f"\n--- Running {scenario_name} on {base_url} ({num_requests} requests) ---")
    for i in range(num_requests):
        current_data = None
        current_url = f"{base_url}{endpoint}"
        if data_generator:
            current_data = data_generator(f"{random.randint(1, 10000000)}_{i}", **kwargs)
        if ids_to_use and i < len(ids_to_use):
            current_url = f"{base_url}{endpoint}/{ids_to_use[i]}"
            if method == "PUT" and data_generator:
                 current_data = data_generator(f"{random.randint(1, 10000000)}_{i}", **kwargs)
        response_time, success, response_json, error_message, status_code = make_request(method, current_url, current_data)
        results.append({
            "scenario": scenario_name, "base_url": base_url,
            "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend",
            "method": method, "endpoint": endpoint, "request_num": i + 1,
            "response_time_ms": response_time, "success": success, "status_code": status_code,
            "message": response_json.get('message', error_message) if response_json else error_message
        })
        if success and method in ["POST", "PUT"]:
            resource_id = get_id_from_response(response_json)
            if resource_id:
                generated_ids.append(resource_id)
                print(f"  Successfully created/updated. ID captured: {resource_id}")
            else:
                print(f"Warning: Could not extract ID from successful response for {scenario_name} (Request {i+1}): {response_json}")
        elif not success:
            print(f"Error in {scenario_name} (Request {i+1}): {error_message} (Status: {status_code}) | Response: {response_json}")
    return results, generated_ids

def cleanup_database_locality_test(base_url):
    print(f"\n--- Cleaning up data for {base_url} (Locality Test) ---")
    
    _, _, all_courses_response_json, _, _ = make_request("GET", f"{base_url}/courses")
    if all_courses_response_json and all_courses_response_json.get('data'):
        course_ids = [get_id_from_response({'data': c}) for c in all_courses_response_json['data'] if 'CLOC' in c.get('course_code', '')]
        if course_ids:
            for course_id in course_ids:
                make_request("DELETE", f"{base_url}/courses/{course_id}")
    
    _, _, all_lecturers_response_json, _, _ = make_request("GET", f"{base_url}/lecturers")
    if all_lecturers_response_json and all_lecturers_response_json.get('data'):
        lecturer_ids = [get_id_from_response({'data': l}) for l in all_lecturers_response_json['data'] if 'Dr. Loc' in l.get('name', '')]
        if lecturer_ids:
            for lecturer_id in lecturer_ids:
                make_request("DELETE", f"{base_url}/lecturers/{lecturer_id}")
    print(f"--- Cleanup for {base_url} (Locality Test) completed. ---")


# --- Main Execution Block ---
if __name__ == "__main__":
    all_locality_results = []

    # --- Pre-test cleanup for locality test data ---
    cleanup_database_locality_test(SQL_BASE_URL)
    cleanup_database_locality_test(NOSQL_BASE_URL)

    # --- 1. Setup for Data Locality Test ---
    print("\n--- Setting up for Data Locality Test ---")
    sql_lecturer_id = None
    nosql_lecturer_id = None
    sql_lecturer_name = None
    sql_lecturer_department = None
    nosql_lecturer_name = None
    nosql_lecturer_department = None

    # Create a lecturer for SQL
    lecturer_results_sql, new_lecturer_id_sql = run_test_scenario("Locality Setup: Create Lecturer", SQL_BASE_URL, "POST", "/lecturers/create", data_generator=lambda r_id: generate_lecturer_data(f"loc_sql_{r_id}"), num_requests=1)
    if new_lecturer_id_sql:
        sql_lecturer_id = new_lecturer_id_sql[0]
        # Fetch lecturer details to use for denormalization
        _, success, response_json, _, _ = make_request("GET", f"{SQL_BASE_URL}/lecturers/{sql_lecturer_id}")
        if success and response_json and response_json.get('data'):
            sql_lecturer_name = response_json['data'].get('name')
            sql_lecturer_department = response_json['data'].get('department')
    else:
        print("SQL Locality Lecturer setup failed.")

    # Create a lecturer for NoSQL
    lecturer_results_nosql, new_lecturer_id_nosql = run_test_scenario("Locality Setup: Create Lecturer", NOSQL_BASE_URL, "POST", "/lecturers/create", data_generator=lambda r_id: generate_lecturer_data(f"loc_nosql_{r_id}"), num_requests=1)
    if new_lecturer_id_nosql:
        nosql_lecturer_id = new_lecturer_id_nosql[0]
        # Fetch lecturer details to use for denormalization
        _, success, response_json, _, _ = make_request("GET", f"{NOSQL_BASE_URL}/lecturers/{nosql_lecturer_id}")
        if success and response_json and response_json.get('data'):
            nosql_lecturer_name = response_json['data'].get('name')
            nosql_lecturer_department = response_json['data'].get('department')
    else:
        print("NoSQL Locality Lecturer setup failed.")


    # Create courses for SQL (regular way)
    if sql_lecturer_id:
        for i in range(NUM_TEST_COURSES):
            _, _ = run_test_scenario(
                "Locality Test: Create Course (SQL)", SQL_BASE_URL, "POST", "/courses/create",
                data_generator=lambda r_id: generate_course_data(sql_lecturer_id, f"loc_sql_{r_id}", capacity=100), num_requests=1
            )
    else:
        print("Skipping SQL Locality Course creation: No lecturer ID available.")

    # Create courses for NoSQL (with denormalized data)
    if nosql_lecturer_id and nosql_lecturer_name and nosql_lecturer_department:
        for i in range(NUM_TEST_COURSES):
            _, _ = run_test_scenario(
                "Locality Test: Create Course (NoSQL, Denormalized)", NOSQL_BASE_URL, "POST", "/courses/create",
                data_generator=lambda r_id: generate_course_data(nosql_lecturer_id, f"loc_nosql_denorm_{r_id}", capacity=100, for_nosql=True, lecturer_name=nosql_lecturer_name, lecturer_department=nosql_lecturer_department), num_requests=1
            )
    else:
        print("Skipping NoSQL Locality Course creation: Missing lecturer ID or details.")


    # --- 2. Run Data Locality Queries ---
    print("\n--- Running Data Locality Queries ---")

    # SQL: Standard Complex Query (Courses with Lecturer Details)
    all_locality_results.extend(run_test_scenario(
        "Locality Query: Courses with Lecturer (SQL)", SQL_BASE_URL, "GET", "/courses/details/full", num_requests=1
    )[0])

    # NoSQL: Complex Query (Courses with Lecturer Details - using $lookup)
    all_locality_results.extend(run_test_scenario(
        "Locality Query: Courses with Lecturer (NoSQL, Lookup)", NOSQL_BASE_URL, "GET", "/courses/details/full", num_requests=1
    )[0])

    # NoSQL: Denormalized Query (Courses with Lecturer Details - direct read)
    all_locality_results.extend(run_test_scenario(
        "Locality Query: Courses with Lecturer (NoSQL, Denormalized)", NOSQL_BASE_URL, "GET", "/courses/details/denormalized", num_requests=1
    )[0])


    # --- Data Analysis and Visualization for Data Locality Test ---
    df_locality_results = pd.DataFrame(all_locality_results)
    
    print("\n--- Raw Data Locality Results Dataframe ---")
    print(df_locality_results)

    print("\n--- Aggregated Data Locality Results ---")
    agg_locality_df = df_locality_results[df_locality_results['request_num'] != 'Total'].groupby(['scenario', 'backend_type'])['response_time_ms'].agg(['mean', 'median', 'std', 'min', 'max']).reset_index()
    print(agg_locality_df)

    # Plot 1: Average Response Time for Data Locality Queries
    plt.figure(figsize=(12, 7))
    sns.barplot(x='scenario', y='mean', hue='backend_type', data=agg_locality_df)
    plt.title('Average Response Time for Data Locality Queries (Lower is Better)')
    plt.ylabel('Average Response Time (ms)')
    plt.xlabel('Query Scenario')
    plt.xticks(rotation=15, ha='right')
    plt.tight_layout()
    plt.show()

    # Plot 2: Success Rate for Data Locality Scenarios
    locality_success_rates = df_locality_results[df_locality_results['request_num'] != 'Total'].groupby(['scenario', 'backend_type'])['success'].mean().reset_index()
    locality_success_rates['success_rate'] = locality_success_rates['success'] * 100

    plt.figure(figsize=(10, 6))
    sns.barplot(x='scenario', y='success_rate', hue='backend_type', data=locality_success_rates)
    plt.title('Success Rate of Data Locality Scenarios (%)')
    plt.ylabel('Success Rate (%)')
    plt.xlabel('Scenario')
    plt.ylim(0, 100)
    plt.xticks(rotation=15, ha='right')
    plt.tight_layout()
    plt.show()
