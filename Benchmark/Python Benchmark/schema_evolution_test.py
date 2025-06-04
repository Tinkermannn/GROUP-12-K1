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
NUM_TEST_STUDENTS = 50 # Number of students to create/update for schema test

# --- Helper Functions (copied for self-containment) ---
def generate_random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def generate_random_numeric_string(length=8):
    digits = string.digits
    return ''.join(random.choice(digits) for i in range(length))

def generate_user_data(random_id):
    username = f"user_schema_{random_id}"
    email = f"user_schema_{random_id}@example.com"
    return { "username": username, "email": email, "password": "Password123!", "role": "student" }

def generate_student_data(user_id, random_id, student_status=None, for_nosql=False): # Added student_status
    data = {
        "nim": f"NIMSCH{random_id}",
        "name": f"Student Schema {random_id}",
        "major": "Computer Science",
        "semester": 1
    }
    if for_nosql:
        data["userId"] = user_id
    else:
        data["user_id"] = user_id
    
    if student_status is not None: # Only add if provided
        data["student_status"] = student_status
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

def cleanup_database_schema_test(base_url):
    print(f"\n--- Cleaning up data for {base_url} (Schema Test) ---")
    
    _, _, all_students_response_json, _, _ = make_request("GET", f"{base_url}/students")
    if all_students_response_json and all_students_response_json.get('data'):
        student_ids = [get_id_from_response({'data': s}) for s in all_students_response_json['data'] if 'NIMSCH' in s.get('nim', '')]
        if student_ids:
            for student_id in student_ids:
                make_request("DELETE", f"{base_url}/students/{student_id}")
    
    _, _, all_users_response_json, _, _ = make_request("GET", f"{base_url}/users")
    if all_users_response_json and all_users_response_json.get('data'):
        user_ids = [get_id_from_response({'data': u}) for u in all_users_response_json['data'] if 'user_schema' in u.get('username', '')]
        if user_ids:
            for user_id in user_ids:
                make_request("DELETE", f"{base_url}/users/{user_id}")
    print(f"--- Cleanup for {base_url} (Schema Test) completed. ---")


# --- Main Execution Block ---
if __name__ == "__main__":
    all_schema_results = []

    # --- Pre-test cleanup for schema test data ---
    cleanup_database_schema_test(SQL_BASE_URL)
    cleanup_database_schema_test(NOSQL_BASE_URL)

    # --- 1. SQL Schema Evolution Test ---
    print("\n--- Running SQL Schema Evolution Test ---")
    sql_user_id = None
    _, new_user_id_sql = run_test_scenario("Schema Setup: Create User", SQL_BASE_URL, "POST", "/users/create", data_generator=lambda r_id: generate_user_data(f"schema_sql_{r_id}"), num_requests=1)
    if new_user_id_sql: sql_user_id = new_user_id_sql[0]

    if sql_user_id:
        print(f"SQL User ID for schema test: {sql_user_id}")
        # Create students WITHOUT the new field (initial state)
        initial_sql_student_ids = []
        for i in range(NUM_TEST_STUDENTS):
            _, new_student_id = run_test_scenario(
                "Schema Test: Create Student (SQL, No Status)", SQL_BASE_URL, "POST", "/students/create",
                data_generator=lambda r_id: generate_student_data(sql_user_id, f"sch_sql_no_status_{r_id}", student_status=None), num_requests=1
            )
            if new_student_id: initial_sql_student_ids.extend(new_student_id)
        
        # Measure read time for students without the new field
        read_no_status_results, _ = run_test_scenario(
            "Schema Test: Read Students (SQL, No Status)", SQL_BASE_URL, "GET", "/students", num_requests=1
        )
        all_schema_results.extend(read_no_status_results)

        # Create students WITH the new field
        new_status_sql_student_ids = []
        for i in range(NUM_TEST_STUDENTS):
            _, new_student_id = run_test_scenario(
                "Schema Test: Create Student (SQL, With Status)", SQL_BASE_URL, "POST", "/students/create",
                data_generator=lambda r_id: generate_student_data(sql_user_id, f"sch_sql_with_status_{r_id}", student_status="active"), num_requests=1
            )
            if new_student_id: new_status_sql_student_ids.extend(new_student_id)

        # Measure read time for students with the new field
        read_with_status_results, _ = run_test_scenario(
            "Schema Test: Read Students (SQL, With Status)", SQL_BASE_URL, "GET", "/students", num_requests=1
        )
        all_schema_results.extend(read_with_status_results)

        # Update existing students to add the new field
        for i, student_id in enumerate(initial_sql_student_ids):
             _, _ = run_test_scenario(
                "Schema Test: Update Student (SQL, Add Status)", SQL_BASE_URL, "PUT", "/students",
                data_generator=lambda r_id: {"student_status": "on_leave"}, ids_to_use=[student_id], num_requests=1
            )
        
        # Measure read time after updates
        read_after_update_results, _ = run_test_scenario(
            "Schema Test: Read Students (SQL, After Update)", SQL_BASE_URL, "GET", "/students", num_requests=1
        )
        all_schema_results.extend(read_after_update_results)

    else:
        print("Skipping SQL Schema Evolution Test: User setup failed.")


    # --- 2. NoSQL Schema Evolution Test ---
    print("\n--- Running NoSQL Schema Evolution Test ---")
    nosql_user_id = None
    _, new_user_id_nosql = run_test_scenario("Schema Setup: Create User", NOSQL_BASE_URL, "POST", "/users/create", data_generator=lambda r_id: generate_user_data(f"schema_nosql_{r_id}"), num_requests=1)
    if new_user_id_nosql: nosql_user_id = new_user_id_nosql[0]

    if nosql_user_id:
        print(f"NoSQL User ID for schema test: {nosql_user_id}")
        # Create students WITHOUT the new field (initial state)
        initial_nosql_student_ids = []
        for i in range(NUM_TEST_STUDENTS):
            _, new_student_id = run_test_scenario(
                "Schema Test: Create Student (NoSQL, No Status)", NOSQL_BASE_URL, "POST", "/students/create",
                data_generator=lambda r_id: generate_student_data(nosql_user_id, f"sch_nosql_no_status_{r_id}", student_status=None, for_nosql=True), num_requests=1
            )
            if new_student_id: initial_nosql_student_ids.extend(new_student_id)
        
        # Measure read time for students without the new field
        read_no_status_nosql_results, _ = run_test_scenario(
            "Schema Test: Read Students (NoSQL, No Status)", NOSQL_BASE_URL, "GET", "/students", num_requests=1
        )
        all_schema_results.extend(read_no_status_nosql_results)

        # Create students WITH the new field
        new_status_nosql_student_ids = []
        for i in range(NUM_TEST_STUDENTS):
            _, new_student_id = run_test_scenario(
                "Schema Test: Create Student (NoSQL, With Status)", NOSQL_BASE_URL, "POST", "/students/create",
                data_generator=lambda r_id: generate_student_data(nosql_user_id, f"sch_nosql_with_status_{r_id}", student_status="active", for_nosql=True), num_requests=1
            )
            if new_student_id: new_status_nosql_student_ids.extend(new_student_id)

        # Measure read time for students with the new field
        read_with_status_nosql_results, _ = run_test_scenario(
            "Schema Test: Read Students (NoSQL, With Status)", NOSQL_BASE_URL, "GET", "/students", num_requests=1
        )
        all_schema_results.extend(read_with_status_nosql_results)

        # Update existing students to add the new field
        for i, student_id in enumerate(initial_nosql_student_ids):
             _, _ = run_test_scenario(
                "Schema Test: Update Student (NoSQL, Add Status)", NOSQL_BASE_URL, "PUT", "/students",
                data_generator=lambda r_id: {"student_status": "on_leave"}, ids_to_use=[student_id], num_requests=1
            )
        
        # Measure read time after updates
        read_after_update_nosql_results, _ = run_test_scenario(
            "Schema Test: Read Students (NoSQL, After Update)", NOSQL_BASE_URL, "GET", "/students", num_requests=1
        )
        all_schema_results.extend(read_after_update_nosql_results)

    else:
        print("Skipping NoSQL Schema Evolution Test: User setup failed.")


    # --- Data Analysis and Visualization for Schema Evolution Test ---
    df_schema_results = pd.DataFrame(all_schema_results)
    
    print("\n--- Raw Schema Evolution Results Dataframe ---")
    print(df_schema_results)

    print("\n--- Aggregated Schema Evolution Results ---")
    agg_schema_df = df_schema_results[df_schema_results['request_num'] != 'Total'].groupby(['scenario', 'backend_type'])['response_time_ms'].agg(['mean', 'median', 'std', 'min', 'max']).reset_index()
    print(agg_schema_df)

    # Plot 1: Create Student Performance (No Status vs With Status)
    plt.figure(figsize=(12, 7))
    sns.barplot(x='scenario', y='mean', hue='backend_type', data=agg_schema_df[agg_schema_df['scenario'].str.contains('Create Student')])
    plt.title('Create Student Performance: No Status vs With Status (Lower is Better)')
    plt.ylabel('Average Response Time (ms)')
    plt.xlabel('Scenario')
    plt.xticks(rotation=15, ha='right')
    plt.tight_layout()
    plt.show()

    # Plot 2: Read Student Performance (No Status vs With Status vs After Update)
    plt.figure(figsize=(12, 7))
    sns.barplot(x='scenario', y='mean', hue='backend_type', data=agg_schema_df[agg_schema_df['scenario'].str.contains('Read Students')])
    plt.title('Read Student Performance: Impact of Schema Evolution (Lower is Better)')
    plt.ylabel('Average Response Time (ms)')
    plt.xlabel('Scenario')
    plt.xticks(rotation=15, ha='right')
    plt.tight_layout()
    plt.show()

    # Plot 3: Update Student Performance (Add Status)
    plt.figure(figsize=(8, 6))
    sns.barplot(x='backend_type', y='mean', data=agg_schema_df[agg_schema_df['scenario'].str.contains('Update Student \(SQL, Add Status\)|Update Student \(NoSQL, Add Status\)')])
    plt.title('Update Student Performance: Adding New Field (Lower is Better)')
    plt.ylabel('Average Response Time (ms)')
    plt.xlabel('Backend Type')
    plt.tight_layout()
    plt.show()

    # Plot 4: Success Rate for Schema Evolution Scenarios
    schema_success_rates = df_schema_results[df_schema_results['request_num'] != 'Total'].groupby(['scenario', 'backend_type'])['success'].mean().reset_index()
    schema_success_rates['success_rate'] = schema_success_rates['success'] * 100

    plt.figure(figsize=(12, 7))
    sns.barplot(x='scenario', y='success_rate', hue='backend_type', data=schema_success_rates)
    plt.title('Success Rate of Schema Evolution Scenarios (%)')
    plt.ylabel('Success Rate (%)')
    plt.xlabel('Scenario')
    plt.ylim(0, 100)
    plt.xticks(rotation=30, ha='right')
    plt.tight_layout()
    plt.show()
