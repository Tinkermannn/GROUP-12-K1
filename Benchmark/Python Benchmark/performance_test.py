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
DEFAULT_COURSE_CAPACITY = 1000 # Default capacity for courses created in this script

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

def generate_student_data(user_id, random_id, for_nosql=False):
    """Generates unique student data."""
    if for_nosql:
        return {
            "userId": user_id,
            "nim": f"NIM{random_id}_{generate_random_string(3)}",
            "name": f"Student {random_id}",
            "major": random.choice(["Computer Science", "Information Systems", "Mathematics", "Physics"]),
            "semester": random.randint(1, 8)
        }
    else:
        return {
            "user_id": user_id,
            "nim": f"NIM{random_id}_{generate_random_string(3)}",
            "name": f"Student {random_id}",
            "major": random.choice(["Computer Science", "Information Systems", "Mathematics", "Physics"]),
            "semester": random.randint(1, 8)
        }

def generate_lecturer_data(random_id):
    """Generates unique lecturer data."""
    return {
        "name": f"Dr. {generate_random_string(5)}",
        "nidn": f"{generate_random_numeric_string(8)}",
        "department": random.choice(["Computer Science", "Information Systems", "Electrical Engineering"])
    }

def generate_course_data(lecturer_id, random_id, capacity=DEFAULT_COURSE_CAPACITY, prerequisites=None, for_nosql=False):
    """Generates unique course data."""
    if prerequisites is None:
        prerequisites = []
    
    if for_nosql:
        return {
            "course_code": f"C{random_id}_{generate_random_string(3)}",
            "name": f"Course {random_id} {generate_random_string(5)}",
            "credits": random.choice([2, 3, 4]),
            "semester": random.randint(1, 8),
            "lecturerId": lecturer_id,
            "prerequisiteIds": prerequisites,
            "capacity": capacity
        }
    else:
        return {
            "course_code": f"C{random_id}_{generate_random_string(3)}",
            "name": f"Course {random_id} {generate_random_string(5)}",
            "credits": random.choice([2, 3, 4]),
            "semester": random.randint(1, 8),
            "lecturer_id": lecturer_id,
            "prerequisiteIds": prerequisites,
            "capacity": capacity
        }

def generate_course_registration_data(student_id, course_id, for_nosql=False):
    """Generates unique course registration data."""
    if for_nosql:
        return {
            "studentId": student_id,
            "courseId": course_id,
            "academic_year": "2024/2025",
            "semester": random.choice(["Ganjil", "Genap"]),
            "status": random.choice(["registered", "approved"])
        }
    else:
        return {
            "student_id": student_id,
            "course_id": course_id,
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

        response_time = (time.perf_counter() - start_time) * 1000 # in milliseconds
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
    """Extracts ID from various response structures."""
    if response_json:
        if response_json.get('payload') and (response_json['payload'].get('id') or response_json['payload'].get('_id')):
            return str(response_json['payload'].get('id') or response_json['payload'].get('_id'))
        elif response_json.get('data') and (response_json['data'].get('id') or response_json['data'].get('_id')):
            return str(response_json['data'].get('id') or response_json['data'].get('_id'))
        elif response_json.get('id') or response_json.get('_id'):
            return str(response_json.get('id') or response_json.get('_id'))
    return None

# --- Test Execution Functions ---
def run_test_scenario(scenario_name, base_url, method, endpoint, data_generator=None, num_requests=1, ids_to_use=None, **kwargs):
    """
    Runs a single test scenario and collects results.
    ids_to_use: A list of IDs to use for operations like GET by ID, PUT, DELETE.
    kwargs: Additional arguments to pass to data_generator (e.g., for_nosql)
    """
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
        
        result_entry = {
            "scenario": scenario_name,
            "base_url": base_url,
            "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend",
            "method": method,
            "endpoint": endpoint,
            "request_num": i + 1,
            "response_time_ms": response_time,
            "success": success,
            "status_code": status_code,
            "message": response_json.get('message', error_message) if response_json else error_message
        }
        results.append(result_entry)

        if success and method in ["POST", "PUT"]:
            resource_id = get_id_from_response(response_json)
            if resource_id:
                generated_ids.append(resource_id)
            # else: # Removed warning for cleaner logs
                # print(f"Warning: Could not extract ID from successful response for {scenario_name} (Request {i+1}): {response_json}")
        elif not success:
            print(f"Error in {scenario_name} (Request {i+1}): {error_message} (Status: {status_code}) | Response: {response_json}")

    return results, generated_ids

def run_batch_create_scenario(scenario_name, base_url, endpoint, data_generator, num_items, *args, **kwargs):
    """
    Runs a batch create scenario and collects results.
    data_generator: The function to generate data for a single item.
    num_items: The number of items to create in this batch.
    *args: Positional arguments to pass to data_generator (e.g., user_id, lecturer_id).
    kwargs: Keyword arguments to pass to data_generator (e.g., for_nosql, capacity).
    Returns (results, list_of_created_ids)
    """
    created_ids = []
    results = []
    print(f"\n--- Running {scenario_name} on {base_url} ({num_items} items) ---")
    
    start_total_time = time.perf_counter()
    for i in range(num_items):
        random_id = f"{random.randint(1, 10000000)}_{i}"
        # Pass all *args and **kwargs correctly to data_generator
        data = data_generator(*args, random_id, **kwargs)
        
        response_time, success, response_json, error_message, status_code = make_request("POST", f"{base_url}{endpoint}", data)
        
        results.append({
            "scenario": scenario_name,
            "base_url": base_url,
            "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend",
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
            # else: # Removed warning for cleaner logs
                # print(f"Warning: Could not extract ID from successful response for {scenario_name} (Item {i+1}): {response_json}")
        else:
            print(f"Error in {scenario_name} (Item {i+1}): {error_message} (Status: {status_code}) | Response: {response_json}")
            
    total_time_ms = (time.perf_counter() - start_total_time) * 1000
    
    results.append({
        "scenario": f"{scenario_name} (Total)",
        "base_url": base_url,
        "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend",
        "method": "POST",
        "endpoint": endpoint,
        "request_num": "Total",
        "response_time_ms": total_time_ms,
        "success": all(r['success'] for r in results if r['request_num'] != 'Total'),
        "status_code": "N/A",
        "message": f"Total time for {num_items} creations"
    })
    
    return results, created_ids

def run_batch_update_scenario(scenario_name, base_url, endpoint, data_generator, num_items, ids_to_update, **kwargs):
    """
    Runs a batch update scenario, updating existing items.
    ids_to_update: List of IDs of items to update.
    """
    results = []
    print(f"\n--- Running {scenario_name} on {base_url} ({num_items} items) ---")

    if not ids_to_update:
        print(f"Skipping {scenario_name}: No IDs available to update.")
        return [], []

    actual_num_updates = min(num_items, len(ids_to_update))
    
    start_total_time = time.perf_counter()
    for i in range(actual_num_updates):
        item_id = ids_to_update[i]
        update_data = data_generator(f"update_{random.randint(1, 10000000)}_{i}", **kwargs)
        
        response_time, success, response_json, error_message, status_code = make_request("PUT", f"{base_url}{endpoint}/{item_id}", update_data)
        
        results.append({
            "scenario": scenario_name,
            "base_url": base_url,
            "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend",
            "method": "PUT",
            "endpoint": endpoint,
            "request_num": i + 1,
            "response_time_ms": response_time,
            "success": success,
            "status_code": status_code,
            "message": response_json.get('message', error_message) if response_json else error_message
        })
        
        if not success:
            print(f"Error in {scenario_name} (Item {i+1}, ID {item_id}): {error_message} (Status: {status_code}) | Response: {response_json}")
            
    total_time_ms = (time.perf_counter() - start_total_time) * 1000
    
    results.append({
        "scenario": f"{scenario_name} (Total)",
        "base_url": base_url,
        "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend",
        "method": "PUT",
        "endpoint": endpoint,
        "request_num": "Total",
        "response_time_ms": total_time_ms,
        "success": all(r['success'] for r in results if r['request_num'] != 'Total'),
        "status_code": "N/A",
        "message": f"Total time for {actual_num_updates} updates"
    })
    
    return results, []

def run_batch_delete_scenario(scenario_name, base_url, endpoint, ids_to_delete):
    """
    Runs a batch delete scenario, deleting existing items.
    ids_to_delete: List of IDs of items to delete.
    """
    results = []
    print(f"\n--- Running {scenario_name} on {base_url} ({len(ids_to_delete)} items) ---")

    if not ids_to_delete:
        print(f"Skipping {scenario_name}: No IDs available to delete.")
        return [], []

    start_total_time = time.perf_counter()
    for i, item_id in enumerate(ids_to_delete):
        response_time, success, response_json, error_message, status_code = make_request("DELETE", f"{base_url}{endpoint}/{item_id}")
        
        results.append({
            "scenario": scenario_name,
            "base_url": base_url,
            "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend",
            "method": "DELETE",
            "endpoint": endpoint,
            "request_num": i + 1,
            "response_time_ms": response_time,
            "success": success,
            "status_code": status_code,
            "message": response_json.get('message', error_message) if response_json else error_message
        })
        
        if not success:
            print(f"Error in {scenario_name} (Item {i+1}, ID {item_id}): {error_message} (Status: {status_code}) | Response: {response_json}")
            
    total_time_ms = (time.perf_counter() - start_total_time) * 1000
    
    results.append({
        "scenario": f"{scenario_name} (Total)",
        "base_url": base_url,
        "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend",
        "method": "DELETE",
        "endpoint": endpoint,
        "request_num": "Total",
        "response_time_ms": total_time_ms,
        "success": all(r['success'] for r in results if r['request_num'] != 'Total'),
        "status_code": "N/A",
        "message": f"Total time for {len(ids_to_delete)} deletions"
    })
    
    return results, []


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
                "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend",
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
        "backend_type": "SQL Backend" if base_url == SQL_BASE_URL else "NoSQL Backend",
        "method": "GET",
        "endpoint": endpoint,
        "request_num": "Total",
        "response_time_ms": total_time_ms,
        "success": all(r['success'] for r in results if r['request_num'] != 'Total'),
        "status_code": "N/A",
        "message": f"Total time for {num_concurrent_requests} concurrent requests"
    })
    
    return results

def cleanup_database(base_url):
    """
    Cleans up all dynamically created data in the database.
    This assumes your delete endpoints handle cascading deletes or you delete in reverse order of creation.
    For simplicity, we'll try to delete users, lecturers, students, and courses.
    """
    print(f"\n--- Cleaning up data for {base_url} ---")
    cleanup_results = []

    _, success_students, all_students_response_json, _, _ = make_request("GET", f"{base_url}/students")
    if success_students and all_students_response_json and all_students_response_json.get('data'):
        student_ids = [get_id_from_response({'data': s}) for s in all_students_response_json['data']]
        if student_ids:
            delete_student_results, _ = run_batch_delete_scenario("Cleanup: Delete Students", base_url, "/students", student_ids)
            cleanup_results.extend(delete_student_results)
    
    _, success_courses, all_courses_response_json, _, _ = make_request("GET", f"{base_url}/courses")
    if success_courses and all_courses_response_json and all_courses_response_json.get('data'):
        course_ids = [get_id_from_response({'data': c}) for c in all_courses_response_json['data']]
        if course_ids:
            delete_course_results, _ = run_batch_delete_scenario("Cleanup: Delete Courses", base_url, "/courses", course_ids)
            cleanup_results.extend(delete_course_results)

    _, success_lecturers, all_lecturers_response_json, _, _ = make_request("GET", f"{base_url}/lecturers")
    if success_lecturers and all_lecturers_response_json and all_lecturers_response_json.get('data'):
        lecturer_ids = [get_id_from_response({'data': l}) for l in all_lecturers_response_json['data']]
        if lecturer_ids:
            delete_lecturer_results, _ = run_batch_delete_scenario("Cleanup: Delete Lecturers", base_url, "/lecturers", lecturer_ids)
            cleanup_results.extend(delete_lecturer_results)

    _, success_users, all_users_response_json, _, _ = make_request("GET", f"{base_url}/users")
    if success_users and all_users_response_json and all_users_response_json.get('data'):
        user_ids = [get_id_from_response({'data': u}) for u in all_users_response_json['data']]
        if user_ids:
            delete_user_results, _ = run_batch_delete_scenario("Cleanup: Delete Users", base_url, "/users", user_ids)
            cleanup_results.extend(delete_user_results)

    print(f"--- Cleanup for {base_url} completed. ---")
    return cleanup_results


# --- Main Execution Block ---
if __name__ == "__main__":
    all_results = []
    
    # --- 0. Pre-Test Cleanup (Optional, but good for consistent runs) ---
    print("\n--- Performing pre-test cleanup ---")
    all_results.extend(cleanup_database(SQL_BASE_URL))
    all_results.extend(cleanup_database(NOSQL_BASE_URL))


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
            data_generator=lambda r_id: generate_course_data(lecturer_ids_sql[0], f"setup_sql_{r_id}", capacity=DEFAULT_COURSE_CAPACITY), num_requests=1
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
    if new_user_id_nosql:
        user_ids_nosql.extend(new_user_id_nosql)
        print(f"  NoSQL User ID (for dependent tests): {user_ids_nosql[0]}")
    else:
        print("NoSQL User setup failed, subsequent dependent setups may be skipped.")

    lecturer_results_nosql, new_lecturer_id_nosql = run_test_scenario(
        "Setup: Create Lecturer", NOSQL_BASE_URL, "POST", "/lecturers/create",
        data_generator=lambda r_id: generate_lecturer_data(f"setup_nosql_{r_id}"), num_requests=1
    )
    all_results.extend(lecturer_results_nosql)
    if new_lecturer_id_nosql:
        lecturer_ids_nosql.extend(new_lecturer_id_nosql)
        print(f"  NoSQL Lecturer ID (for dependent tests): {lecturer_ids_nosql[0]}")
    else:
        print("NoSQL Lecturer setup failed, subsequent dependent setups may be skipped.")

    if lecturer_ids_nosql:
        course_results_nosql, new_course_id_nosql = run_test_scenario(
            "Setup: Create Course", NOSQL_BASE_URL, "POST", "/courses/create",
            data_generator=lambda r_id: generate_course_data(lecturer_ids_nosql[0], f"setup_nosql_{r_id}", capacity=DEFAULT_COURSE_CAPACITY, for_nosql=True),
            num_requests=1
        )
        all_results.extend(course_results_nosql)
        if new_course_id_nosql: course_ids_nosql.extend(new_course_id_nosql)
        else: print("NoSQL Course setup failed, subsequent dependent setups may be skipped.")
    else:
        print("Skipping NoSQL Course setup: No lecturer ID available.")

    if user_ids_nosql:
        student_results_nosql, new_student_id_nosql = run_test_scenario(
            "Setup: Create Student", NOSQL_BASE_URL, "POST", "/students/create",
            data_generator=lambda r_id: generate_student_data(user_ids_nosql[0], f"setup_nosql_{r_id}", for_nosql=True),
            num_requests=1
        )
        all_results.extend(student_results_nosql)
        if new_student_id_nosql: student_ids_nosql.extend(new_student_id_nosql)
        else: print("NoSQL Student setup failed, subsequent dependent setups may be skipped.")
    else:
        print("Skipping NoSQL Student setup: No user ID available.")

    # --- 2. Batch Operations ---
    print("\n--- Running Batch Operations ---")
    
    # Batch Create Users
    batch_user_results_sql, created_user_ids_sql = run_batch_create_scenario(
        f"Batch Create Users ({NUM_ITERATIONS_BATCH})", SQL_BASE_URL, "/users/create",
        generate_user_data, NUM_ITERATIONS_BATCH
    )
    all_results.extend(batch_user_results_sql)

    batch_user_results_nosql, created_user_ids_nosql = run_batch_create_scenario(
        f"Batch Create Users ({NUM_ITERATIONS_BATCH})", NOSQL_BASE_URL, "/users/create",
        generate_user_data, NUM_ITERATIONS_BATCH
    )
    all_results.extend(batch_user_results_nosql)

    # Batch Create Students
    if user_ids_sql:
        batch_student_results_sql, created_student_ids_sql = run_batch_create_scenario(
            f"Batch Create Students ({NUM_ITERATIONS_BATCH})", SQL_BASE_URL, "/students/create",
            generate_student_data, NUM_ITERATIONS_BATCH, user_ids_sql[0] 
        )
        all_results.extend(batch_student_results_sql)
    else:
        print("Skipping Batch Create Students (SQL): No user ID available from setup.")
        created_student_ids_sql = []

    if user_ids_nosql:
        batch_student_results_nosql, created_student_ids_nosql = run_batch_create_scenario(
            f"Batch Create Students ({NUM_ITERATIONS_BATCH})", NOSQL_BASE_URL, "/students/create",
            generate_student_data, NUM_ITERATIONS_BATCH, user_ids_nosql[0], for_nosql=True
        )
        all_results.extend(batch_student_results_nosql)
    else:
        print("Skipping Batch Create Students (NoSQL): No user ID available from setup.")
        created_student_ids_nosql = []

    # Batch Create Courses
    if lecturer_ids_sql:
        batch_course_results_sql, created_course_ids_sql = run_batch_create_scenario(
            f"Batch Create Courses ({NUM_ITERATIONS_BATCH})", SQL_BASE_URL, "/courses/create",
            generate_course_data, NUM_ITERATIONS_BATCH, lecturer_ids_sql[0], capacity=DEFAULT_COURSE_CAPACITY
        )
        all_results.extend(batch_course_results_sql)
    else:
        print("Skipping Batch Create Courses (SQL): No lecturer ID available from setup.")
        created_course_ids_sql = []

    if lecturer_ids_nosql:
        batch_course_results_nosql, created_course_ids_nosql = run_batch_create_scenario(
            f"Batch Create Courses ({NUM_ITERATIONS_BATCH})", NOSQL_BASE_URL, "/courses/create",
            generate_course_data, NUM_ITERATIONS_BATCH, lecturer_ids_nosql[0], capacity=DEFAULT_COURSE_CAPACITY, for_nosql=True
        )
        all_results.extend(batch_course_results_nosql)
    else:
        print("Skipping Batch Create Courses (NoSQL): No lecturer ID available from setup.")
        created_course_ids_nosql = []

    # Batch Update Users
    if created_user_ids_sql:
        update_user_results_sql, _ = run_batch_update_scenario(
            f"Batch Update Users ({NUM_ITERATIONS_BATCH})", SQL_BASE_URL, "/users",
            data_generator=lambda r_id: {"username": f"updated_user_{r_id}"}, # Removed **kwargs from lambda call directly here
            num_items=NUM_ITERATIONS_BATCH, ids_to_update=created_user_ids_sql
        )
        all_results.extend(update_user_results_sql)
    else:
        print("Skipping Batch Update Users (SQL): No user IDs available from batch creation.")

    if created_user_ids_nosql:
        update_user_results_nosql, _ = run_batch_update_scenario(
            f"Batch Update Users ({NUM_ITERATIONS_BATCH})", NOSQL_BASE_URL, "/users",
            data_generator=lambda r_id: {"username": f"updated_user_{r_id}"}, # Removed **kwargs from lambda call directly here
            num_items=NUM_ITERATIONS_BATCH, ids_to_update=created_user_ids_nosql
        )
        all_results.extend(update_user_results_nosql)
    else:
        print("Skipping Batch Update Users (NoSQL): No user IDs available from batch creation.")

    # Batch Delete Users
    if created_user_ids_sql:
        delete_user_results_sql, _ = run_batch_delete_scenario(
            f"Batch Delete Users ({NUM_ITERATIONS_BATCH})", SQL_BASE_URL, "/users", created_user_ids_sql
        )
        all_results.extend(delete_user_results_sql)
    else:
        print("Skipping Batch Delete Users (SQL): No user IDs available for deletion.")

    if created_user_ids_nosql:
        delete_user_results_nosql, _ = run_batch_delete_scenario(
            f"Batch Delete Users ({NUM_ITERATIONS_BATCH})", NOSQL_BASE_URL, "/users", created_user_ids_nosql
        )
        all_results.extend(delete_user_results_nosql)
    else:
        print("Skipping Batch Delete Users (NoSQL): No user IDs available for deletion.")


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

    # Concurrent Complex Query: Students with Details & Courses
    all_results.extend(run_concurrent_read_scenario(
        f"Concurrent Complex Query: Students with Details & Courses ({NUM_CONCURRENT_REQUESTS})", SQL_BASE_URL, "/students/details/full", NUM_CONCURRENT_REQUESTS
    ))
    all_results.extend(run_concurrent_read_scenario(
        f"Concurrent Complex Query: Students with Details & Courses ({NUM_CONCURRENT_REQUESTS})", NOSQL_BASE_URL, "/students/details/full", NUM_CONCURRENT_REQUESTS
    ))


    # --- Data Analysis and Visualization ---
    df_results = pd.DataFrame(all_results)
    
    # Filter out setup results for main analysis if desired, or keep for overall view
    df_analysis = df_results[~df_results['scenario'].str.startswith('Setup:')].copy()
    
    print("\n--- Raw Results Dataframe (Filtered) ---")
    print(df_analysis)

    print("\n--- Aggregated Results (Mean, Median, Std Dev) ---")
    agg_df = df_analysis[df_analysis['request_num'] != 'Total'].groupby(['scenario', 'backend_type'])['response_time_ms'].agg(['mean', 'median', 'std', 'min', 'max']).reset_index()
    print(agg_df)

    print("\n--- Total Times for Batch and Concurrent Scenarios ---")
    total_times_df = df_analysis[df_analysis['request_num'] == 'Total'].groupby(['scenario', 'backend_type'])['response_time_ms'].agg(['sum']).reset_index()
    total_times_df.rename(columns={'sum': 'total_time_ms'}, inplace=True)
    print(total_times_df)

    # --- Plotting ---
    sns.set_theme(style="whitegrid")

    # Plot 1: Average Response Times for Complex Queries
    plt.figure(figsize=(12, 7))
    sns.barplot(x='scenario', y='mean', hue='backend_type', data=agg_df[agg_df['scenario'].str.startswith('Complex Query:')])
    plt.title('Average Response Times for Complex Queries (Lower is Better)')
    plt.ylabel('Average Response Time (ms)')
    plt.xlabel('Complex Query Scenario')
    plt.xticks(rotation=30, ha='right')
    plt.tight_layout()
    plt.show()

    # Plot 2: Total Time for Batch Create Users
    plt.figure(figsize=(8, 6))
    sns.barplot(x='backend_type', y='total_time_ms', data=total_times_df[total_times_df['scenario'].str.contains('Batch Create Users')])
    plt.title(f'Total Time for Batch Create Users ({NUM_ITERATIONS_BATCH} items) (Lower is Better)')
    plt.ylabel('Total Time (ms)')
    plt.xlabel('Backend Type')
    plt.tight_layout()
    plt.show()

    # Plot 3: Average Response Time for Concurrent Reads (Get All Users)
    plt.figure(figsize=(8, 6))
    sns.barplot(x='backend_type', y='mean', data=agg_df[agg_df['scenario'].str.contains('Concurrent Get All Users')])
    plt.title(f'Average Response Time for Concurrent Get All Users ({NUM_CONCURRENT_REQUESTS} requests) (Lower is Better)')
    plt.ylabel('Average Response Time (ms)')
    plt.xlabel('Backend Type')
    plt.tight_layout()
    plt.show()

    # Plot 4: Total Time for Batch Create Students
    plt.figure(figsize=(8, 6))
    sns.barplot(x='backend_type', y='total_time_ms', data=total_times_df[total_times_df['scenario'].str.contains('Batch Create Students')])
    plt.title(f'Total Time for Batch Create Students ({NUM_ITERATIONS_BATCH} items) (Lower is Better)')
    plt.ylabel('Total Time (ms)')
    plt.xlabel('Backend Type')
    plt.tight_layout()
    plt.show()

    # Plot 5: Total Time for Batch Create Courses
    plt.figure(figsize=(8, 6))
    sns.barplot(x='backend_type', y='total_time_ms', data=total_times_df[total_times_df['scenario'].str.contains('Batch Create Courses')])
    plt.title(f'Total Time for Batch Create Courses ({NUM_ITERATIONS_BATCH} items) (Lower is Better)')
    plt.ylabel('Total Time (ms)')
    plt.xlabel('Backend Type')
    plt.tight_layout()
    plt.show()

    # Plot 6: Average Response Time for Concurrent Complex Query (Students with Details & Courses)
    plt.figure(figsize=(12, 7))
    sns.barplot(x='backend_type', y='mean', data=agg_df[agg_df['scenario'].str.contains('Concurrent Complex Query: Students with Details & Courses')])
    plt.title(f'Average Response Time for Concurrent Complex Query: Students with Details & Courses ({NUM_CONCURRENT_REQUESTS} requests) (Lower is Better)')
    plt.ylabel('Average Response Time (ms)')
    plt.xlabel('Backend Type')
    plt.tight_layout()
    plt.show()

    # Plot 7: Total Time for Batch Update Users
    plt.figure(figsize=(8, 6))
    sns.barplot(x='backend_type', y='total_time_ms', data=total_times_df[total_times_df['scenario'].str.contains('Batch Update Users')])
    plt.title(f'Total Time for Batch Update Users ({NUM_ITERATIONS_BATCH} items) (Lower is Better)')
    plt.ylabel('Total Time (ms)')
    plt.xlabel('Backend Type')
    plt.tight_layout()
    plt.show()

    # Plot 8: Total Time for Batch Delete Users
    plt.figure(figsize=(8, 6))
    sns.barplot(x='backend_type', y='total_time_ms', data=total_times_df[total_times_df['scenario'].str.contains('Batch Delete Users')])
    plt.title(f'Total Time for Batch Delete Users ({NUM_ITERATIONS_BATCH} items) (Lower is Better)')
    plt.ylabel('Total Time (ms)')
    plt.xlabel('Backend Type')
    plt.tight_layout()
    plt.show()


    # Plot 9: Success Rate for all scenarios
    success_rates = df_analysis.groupby(['scenario', 'backend_type'])['success'].mean().reset_index()
    success_rates['success_rate'] = success_rates['success'] * 100 # Convert to percentage

    plt.figure(figsize=(12, 7))
    sns.barplot(x='scenario', y='success_rate', hue='backend_type', data=success_rates)
    plt.title('Success Rate of Test Scenarios (%)')
    plt.ylabel('Success Rate (%)')
    plt.xlabel('Scenario')
    plt.ylim(0, 100)
    plt.xticks(rotation=30, ha='right')
    plt.tight_layout()
    plt.show()
