import requests
import time
import json
import random
import string
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from concurrent.futures import ThreadPoolExecutor, as_completed

# --- Configuration ---
SQL_BASE_URL = "http://localhost:3000"
NOSQL_BASE_URL = "http://localhost:4000"
NUM_ITERATIONS_BATCH = 100 # Number of items for batch create/update/delete tests
NUM_CONCURRENT_REQUESTS = 50 # Number of concurrent requests for load test

# --- Helper Functions ---

def generate_random_string(length=8):
    """Generates a random string of specified length."""
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def generate_random_numeric_string(length=8):
    """Generates a random numeric string of specified length."""
    digits = string.digits
    return ''.join(random.choice(digits) for i in range(length))

def generate_user_data(random_id):
    """Generates unique user data."""
    username = f"user_{random_id}_{generate_random_string(4)}"
    email = f"user_{random_id}_{generate_random_string(4)}@example.com"
    return {
        "username": username,
        "email": email,
        "password": "Password123!",
        "role": "student"
    }

def generate_student_data(user_id, random_id):
    """Generates unique student data."""
    return {
        "user_id": user_id, # This is the actual user ID string
        "nim": f"NIM{random_id}_{generate_random_string(3)}",
        "name": f"Student {random_id}",
        "major": random.choice(["Computer Science", "Information Systems", "Mathematics", "Physics"]),
        "semester": random.randint(1, 8)
    }

def generate_lecturer_data(random_id):
    """Generates unique lecturer data."""
    return {
        "name": f"Dr. {generate_random_string(5)}",
        "nidn": f"{generate_random_numeric_string(8)}", # <--- Changed to numeric string for SQL
        "department": random.choice(["Computer Science", "Information Systems", "Electrical Engineering"])
    }

def generate_course_data(lecturer_id, random_id, prerequisites=None):
    """Generates unique course data."""
    if prerequisites is None:
        prerequisites = []
    return {
        "course_code": f"C{random_id}_{generate_random_string(3)}",
        "name": f"Course {random_id} {generate_random_string(5)}",
        "credits": random.choice([2, 3, 4]),
        "semester": random.randint(1, 8),
        "lecturer_id": lecturer_id, # This is the actual lecturer ID string
        "prerequisiteIds": prerequisites # Expects an array of IDs
    }

def generate_course_registration_data(student_id, course_id):
    """Generates unique course registration data."""
    return {
        "studentId": student_id,
        "courseId": course_id,
        "academic_year": "2024/2025",
        "semester": random.choice(["Ganjil", "Genap"]),
        "status": random.choice(["registered", "approved"])
    }

def make_request(method, url, data=None, headers=None):
    """
    Helper to make an HTTP request and measure response time.
    Returns (response_time, success, response_json, error_message, status_code)
    """
    start_time = time.perf_counter()
    response_time = 0 # Initialize response_time
    status_code = 'N/A'
    response_json = {} # Initialize to empty dict
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

        response_time = (time.perf_counter() - start_time) * 1000 # in milliseconds
        status_code = response.status_code

        try:
            response_json = response.json()
        except json.JSONDecodeError:
            response_json = {"message": response.text} # Capture non-JSON response

        success = response.ok # True for 2xx status codes
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
    """Extracts ID from various response structures."""
    if response_json:
        # Prioritize 'payload' (SQL), then 'data' (NoSQL often), then direct ID
        if response_json.get('payload') and (response_json['payload'].get('id') or response_json['payload'].get('_id')):
            return str(response_json['payload'].get('id') or response_json['payload'].get('_id'))
        elif response_json.get('data') and (response_json['data'].get('id') or response_json['data'].get('_id')):
            return str(response_json['data'].get('id') or response_json['data'].get('_id'))
        elif response_json.get('id') or response_json.get('_id'):
            return str(response_json.get('id') or response_json.get('_id'))
    return None

# --- Test Execution Functions ---
def run_test_scenario(scenario_name, base_url, method, endpoint, data_generator=None, num_requests=1, ids_to_use=None):
    """
    Runs a single test scenario and collects results.
    ids_to_use: A list of IDs to use for operations like GET by ID, PUT, DELETE.
    """
    results = []
    generated_ids = [] # To store IDs created for subsequent tests

    print(f"\n--- Running {scenario_name} on {base_url} ({num_requests} requests) ---")

    for i in range(num_requests):
        current_data = None
        current_url = f"{base_url}{endpoint}"
        
        # Determine data and URL for current request
        if data_generator:
            # Data generator needs random_id for uniqueness
            current_data = data_generator(f"{random.randint(1, 10000000)}_{i}")
        
        if ids_to_use and i < len(ids_to_use):
            # For operations like GET /:id, PUT /:id, DELETE /:id
            current_url = f"{base_url}{endpoint}/{ids_to_use[i]}"
            # If it's an update, data_generator might still provide the body
            if method == "PUT" and data_generator:
                 current_data = data_generator(f"{random.randint(1, 10000000)}_{i}")

        response_time, success, response_json, error_message, status_code = make_request(method, current_url, current_data)
        
        result_entry = {
            "scenario": scenario_name,
            "base_url": base_url,
            "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend", # New field
            "method": method,
            "endpoint": endpoint,
            "request_num": i + 1,
            "response_time_ms": response_time,
            "success": success,
            "status_code": status_code,
            "message": response_json.get('message', error_message) if response_json else error_message
        }
        results.append(result_entry)

        if success and method in ["POST", "PUT"]: # Capture ID for created/updated resources
            resource_id = get_id_from_response(response_json)
            if resource_id:
                generated_ids.append(resource_id)
                print(f"  Successfully created/updated. ID captured: {resource_id}") # Debug print
            else:
                print(f"Warning: Could not extract ID from successful response for {scenario_name} (Request {i+1}): {response_json}")
        elif not success:
            print(f"Error in {scenario_name} (Request {i+1}): {error_message} (Status: {status_code}) | Response: {response_json}") # Enhanced error print

    return results, generated_ids

def run_batch_create_scenario(scenario_name, base_url, endpoint, data_generator, num_items, *args):
    """
    Runs a batch create scenario and collects results.
    *args are additional arguments to pass to the data_generator (e.g., user_id, lecturer_id)
    Returns (results, list_of_created_ids)
    """
    created_ids = []
    results = []
    print(f"\n--- Running {scenario_name} on {base_url} ({num_items} items) ---")
    
    start_total_time = time.perf_counter()
    for i in range(num_items):
        random_id = f"{random.randint(1, 10000000)}_{i}"
        # Pass additional args to data_generator
        data = data_generator(*args, random_id) if args else data_generator(random_id)
        
        response_time, success, response_json, error_message, status_code = make_request("POST", f"{base_url}{endpoint}", data)
        
        results.append({
            "scenario": scenario_name,
            "base_url": base_url,
            "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend", # New field
            "method": "POST",
            "endpoint": endpoint,
            "request_num": i + 1,
            "response_time_ms": response_time,
            "success": success,
            "status_code": status_code,
            "message": response_json.get('message', error_message) if response_json else error_message
        })
        
        if success:
            resource_id = get_id_from_response(response_json)
            if resource_id:
                created_ids.append(resource_id)
            else:
                print(f"Warning: Could not extract ID from successful response for {scenario_name} (Item {i+1}): {response_json}")
        else:
            print(f"Error in {scenario_name} (Item {i+1}): {error_message} (Status: {status_code}) | Response: {response_json}")
            
    total_time_ms = (time.perf_counter() - start_total_time) * 1000
    
    results.append({
        "scenario": f"{scenario_name} (Total)",
        "base_url": base_url,
        "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend", # New field
        "method": "POST",
        "endpoint": endpoint,
        "request_num": "Total",
        "response_time_ms": total_time_ms,
        "success": all(r['success'] for r in results if r['request_num'] != 'Total'),
        "status_code": "N/A",
        "message": f"Total time for {num_items} creations"
    })
    
    return results, created_ids

def run_concurrent_read_scenario(scenario_name, base_url, endpoint, num_concurrent_requests):
    """
    Runs concurrent GET requests to a specified endpoint.
    """
    results = []
    print(f"\n--- Running {scenario_name} on {base_url} ({num_concurrent_requests} concurrent requests) ---")

    def fetch_url():
        return make_request("GET", f"{base_url}{endpoint}")

    start_total_time = time.perf_counter()
    with ThreadPoolExecutor(max_workers=num_concurrent_requests) as executor:
        futures = [executor.submit(fetch_url) for _ in range(num_concurrent_requests)]
        
        for i, future in enumerate(as_completed(futures)):
            response_time, success, response_json, error_message, status_code = future.result()
            results.append({
                "scenario": scenario_name,
                "base_url": base_url,
                "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend", # New field
                "method": "GET",
                "endpoint": endpoint,
                "request_num": i + 1,
                "response_time_ms": response_time,
                "success": success,
                "status_code": status_code,
                "message": response_json.get('message', error_message) if response_json else error_message
            })
            if not success:
                print(f"Error in {scenario_name} (Request {i+1}): {error_message} (Status: {status_code}) | Response: {response_json}")

    total_time_ms = (time.perf_counter() - start_total_time) * 1000

    results.append({
        "scenario": f"{scenario_name} (Total)",
        "base_url": base_url,
        "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend", # New field
        "method": "GET",
        "endpoint": endpoint,
        "request_num": "Total",
        "response_time_ms": total_time_ms,
        "success": all(r['success'] for r in results if r['request_num'] != 'Total'),
        "status_code": "N/A",
        "message": f"Total time for {num_concurrent_requests} concurrent requests"
    })
    
    return results

# --- Main Execution Block ---
if __name__ == "__main__":
    all_results = []
    
    # --- 1. Setup: Create initial entities for dependent tests ---
    # We need at least one user, lecturer, and course to create students and registrations.
    # These are single creations, not part of the batch tests.

    # SQL Setup
    print("\n--- SQL Backend Setup: Creating initial entities ---")
    user_ids_sql = []
    lecturer_ids_sql = []
    course_ids_sql = []
    student_ids_sql = []

    user_results_sql, new_user_id_sql = run_test_scenario(
        "Setup: Create User", SQL_BASE_URL, "POST", "/users/create",
        data_generator=lambda r_id: generate_user_data(f"setup_sql_{r_id}"), num_requests=1
    )
    all_results.extend(user_results_sql)
    if new_user_id_sql: user_ids_sql.extend(new_user_id_sql)
    else: print("SQL User setup failed, subsequent dependent setups may be skipped.")

    lecturer_results_sql, new_lecturer_id_sql = run_test_scenario(
        "Setup: Create Lecturer", SQL_BASE_URL, "POST", "/lecturers/create",
        data_generator=lambda r_id: generate_lecturer_data(f"setup_sql_{r_id}"), num_requests=1
    )
    all_results.extend(lecturer_results_sql)
    if new_lecturer_id_sql: lecturer_ids_sql.extend(new_lecturer_id_sql)
    else: print("SQL Lecturer setup failed, subsequent dependent setups may be skipped.")

    if lecturer_ids_sql:
        course_results_sql, new_course_id_sql = run_test_scenario(
            "Setup: Create Course", SQL_BASE_URL, "POST", "/courses/create",
            data_generator=lambda r_id: generate_course_data(lecturer_ids_sql[0], f"setup_sql_{r_id}"), num_requests=1
        )
        all_results.extend(course_results_sql)
        if new_course_id_sql: course_ids_sql.extend(new_course_id_sql)
        else: print("SQL Course setup failed, subsequent dependent setups may be skipped.")
    else:
        print("Skipping SQL Course setup: No lecturer ID available.")
    
    if user_ids_sql:
        student_results_sql, new_student_id_sql = run_test_scenario(
            "Setup: Create Student", SQL_BASE_URL, "POST", "/students/create",
            data_generator=lambda r_id: generate_student_data(user_ids_sql[0], f"setup_sql_{r_id}"), num_requests=1
        )
        all_results.extend(student_results_sql)
        if new_student_id_sql: student_ids_sql.extend(new_student_id_sql)
        else: print("SQL Student setup failed, subsequent dependent setups may be skipped.")
    else:
        print("Skipping SQL Student setup: No user ID available.")

    # NoSQL Setup
    print("\n--- NoSQL Backend Setup: Creating initial entities ---")
    user_ids_nosql = []
    lecturer_ids_nosql = []
    course_ids_nosql = []
    student_ids_nosql = []

    user_results_nosql, new_user_id_nosql = run_test_scenario(
        "Setup: Create User", NOSQL_BASE_URL, "POST", "/users/create",
        data_generator=lambda r_id: generate_user_data(f"setup_nosql_{r_id}"), num_requests=1
    )
    all_results.extend(user_results_nosql)
    if new_user_id_nosql: user_ids_nosql.extend(new_user_id_nosql)
    else: print("NoSQL User setup failed, subsequent dependent setups may be skipped.")

    lecturer_results_nosql, new_lecturer_id_nosql = run_test_scenario(
        "Setup: Create Lecturer", NOSQL_BASE_URL, "POST", "/lecturers/create",
        data_generator=lambda r_id: generate_lecturer_data(f"setup_nosql_{r_id}"), num_requests=1
    )
    all_results.extend(lecturer_results_nosql)
    if new_lecturer_id_nosql: lecturer_ids_nosql.extend(new_lecturer_id_nosql)
    else: print("NoSQL Lecturer setup failed, subsequent dependent setups may be skipped.")

    if lecturer_ids_nosql:
        course_results_nosql, new_course_id_nosql = run_test_scenario(
            "Setup: Create Course", NOSQL_BASE_URL, "POST", "/courses/create",
            data_generator=lambda r_id: generate_course_data(lecturer_ids_nosql[0], f"setup_nosql_{r_id}"), num_requests=1
        )
        all_results.extend(course_results_nosql)
        if new_course_id_nosql: course_ids_nosql.extend(new_course_id_nosql)
        else: print("NoSQL Course setup failed, subsequent dependent setups may be skipped.")
    else:
        print("Skipping NoSQL Course setup: No lecturer ID available.")

    if user_ids_nosql:
        student_results_nosql, new_student_id_nosql = run_test_scenario(
            "Setup: Create Student", NOSQL_BASE_URL, "POST", "/students/create",
            data_generator=lambda r_id: generate_student_data(user_ids_nosql[0], f"setup_nosql_{r_id}"), num_requests=1
        )
        all_results.extend(student_results_nosql)
        if new_student_id_nosql: student_ids_nosql.extend(new_student_id_nosql)
        else: print("NoSQL Student setup failed, subsequent dependent setups may be skipped.")
    else:
        print("Skipping NoSQL Student setup: No user ID available.")

    # --- 2. Batch Operations ---
    print("\n--- Running Batch Operations ---")
    
    # Batch Create Users
    batch_user_results_sql, _ = run_batch_create_scenario(
        f"Batch Create Users ({NUM_ITERATIONS_BATCH})", SQL_BASE_URL, "/users/create",
        data_generator=generate_user_data, num_items=NUM_ITERATIONS_BATCH
    )
    all_results.extend(batch_user_results_sql)

    batch_user_results_nosql, _ = run_batch_create_scenario(
        f"Batch Create Users ({NUM_ITERATIONS_BATCH})", NOSQL_BASE_URL, "/users/create",
        data_generator=generate_user_data, num_items=NUM_ITERATIONS_BATCH
    )
    all_results.extend(batch_user_results_nosql)

    # --- 3. Complex Queries ---
    print("\n--- Running Complex Queries ---")

    # Get All Students with Full Details and Courses
    all_results.extend(run_test_scenario(
        "Complex Query: Students with Details & Courses", SQL_BASE_URL, "GET", "/students/details/full", num_requests=1
    )[0])
    all_results.extend(run_test_scenario(
        "Complex Query: Students with Details & Courses", NOSQL_BASE_URL, "GET", "/students/details/full", num_requests=1
    )[0])

    # Get All Courses with Lecturer Details and Prerequisite Course Names
    all_results.extend(run_test_scenario(
        "Complex Query: Courses with Lecturer & Prerequisites", SQL_BASE_URL, "GET", "/courses/details/full", num_requests=1
    )[0])
    all_results.extend(run_test_scenario(
        "Complex Query: Courses with Lecturer & Prerequisites", NOSQL_BASE_URL, "GET", "/courses/details/full", num_requests=1
    )[0])

    # Get All Lecturers with Course Count
    all_results.extend(run_test_scenario(
        "Complex Query: Lecturers with Course Count", SQL_BASE_URL, "GET", "/lecturers/details/course-count", num_requests=1
    )[0])
    all_results.extend(run_test_scenario(
        "Complex Query: Lecturers with Course Count", NOSQL_BASE_URL, "GET", "/lecturers/details/course-count", num_requests=1
    )[0])

    # --- 4. Concurrent Requests (Example: Concurrent Get All Users) ---
    print("\n--- Running Concurrent Requests ---")
    all_results.extend(run_concurrent_read_scenario(
        f"Concurrent Get All Users ({NUM_CONCURRENT_REQUESTS})", SQL_BASE_URL, "/users", NUM_CONCURRENT_REQUESTS
    ))
    all_results.extend(run_concurrent_read_scenario(
        f"Concurrent Get All Users ({NUM_CONCURRENT_REQUESTS})", NOSQL_BASE_URL, "/users", NUM_CONCURRENT_REQUESTS
    ))

    # --- Data Analysis and Visualization ---
    df_results = pd.DataFrame(all_results)
    
    # Filter out setup results for main analysis if desired, or keep for overall view
    df_analysis = df_results[~df_results['scenario'].str.startswith('Setup:')].copy()
    
    print("\n--- Raw Results Dataframe (Filtered) ---")
    print(df_analysis)

    print("\n--- Aggregated Results (Mean, Median, Std Dev) ---")
    # Group by scenario and base_url, exclude 'Total' rows for per-request stats
    agg_df = df_analysis[df_analysis['request_num'] != 'Total'].groupby(['scenario', 'backend_type'])['response_time_ms'].agg(['mean', 'median', 'std', 'min', 'max']).reset_index() # Changed base_url to backend_type
    print(agg_df)

    print("\n--- Total Times for Batch and Concurrent Scenarios ---")
    # Filter for 'Total' rows for batch and concurrent scenarios
    total_times_df = df_analysis[df_analysis['request_num'] == 'Total'].groupby(['scenario', 'backend_type'])['response_time_ms'].agg(['sum']).reset_index() # Changed base_url to backend_type
    total_times_df.rename(columns={'sum': 'total_time_ms'}, inplace=True)
    print(total_times_df)

    # --- Plotting ---
    sns.set_theme(style="whitegrid")

    # Plot 1: Average Response Times for Complex Queries
    plt.figure(figsize=(12, 7))
    sns.barplot(x='scenario', y='mean', hue='backend_type', data=agg_df[agg_df['scenario'].str.startswith('Complex Query:')]) # Changed base_url to backend_type
    plt.title('Average Response Times for Complex Queries (Lower is Better)')
    plt.ylabel('Average Response Time (ms)')
    plt.xlabel('Complex Query Scenario')
    plt.xticks(rotation=30, ha='right')
    plt.tight_layout()
    plt.show()

    # Plot 2: Total Time for Batch Create Users
    plt.figure(figsize=(8, 6))
    sns.barplot(x='backend_type', y='total_time_ms', data=total_times_df[total_times_df['scenario'].str.contains('Batch Create Users')]) # Changed base_url to backend_type
    plt.title(f'Total Time for Batch Create Users ({NUM_ITERATIONS_BATCH} items) (Lower is Better)')
    plt.ylabel('Total Time (ms)')
    plt.xlabel('Backend Type')
    plt.tight_layout()
    plt.show()

    # Plot 3: Average Response Time for Concurrent Reads
    plt.figure(figsize=(8, 6))
    sns.barplot(x='backend_type', y='mean', data=agg_df[agg_df['scenario'].str.contains('Concurrent Get All Users')]) # Changed base_url to backend_type
    plt.title(f'Average Response Time for Concurrent Get All Users ({NUM_CONCURRENT_REQUESTS} requests) (Lower is Better)')
    plt.ylabel('Average Response Time (ms)')
    plt.xlabel('Backend Type')
    plt.tight_layout()
    plt.show()

    # Plot 4: Success Rate for all scenarios
    success_rates = df_analysis.groupby(['scenario', 'backend_type'])['success'].mean().reset_index() # Changed base_url to backend_type
    success_rates['success_rate'] = success_rates['success'] * 100 # Convert to percentage

    plt.figure(figsize=(12, 7))
    sns.barplot(x='scenario', y='success_rate', hue='backend_type', data=success_rates) # Changed base_url to backend_type
    plt.title('Success Rate of Test Scenarios (%)')
    plt.ylabel('Success Rate (%)')
    plt.xlabel('Scenario')
    plt.ylim(0, 100)
    plt.xticks(rotation=30, ha='right')
    plt.tight_layout()
    plt.show()
