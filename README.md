# NoSQL VS SQL Database Benchmarking

## Table of Contents
- [NoSQL VS SQL Database Benchmarking](#nosql-vs-sql-database-benchmarking)
  - [Table of Contents](#table-of-contents)
  - [1. Project Title](#1-project-title)
  - [2. Authors](#2-authors)
  - [3. Project Description](#3-project-description)
    - [Tech Stack](#tech-stack)
      - [Backend \& Runtime](#backend--runtime)
      - [Database](#database)
      - [Containerization](#containerization)
      - [Performance Test \& Analysis](#performance-test--analysis)
  - [4. Project Base Model](#4-project-base-model)
    - [ERD (Conceptual)](#erd-conceptual)
    - [Docker Container Design](#docker-container-design)
    - [Test Script Structure \& Key Functions](#test-script-structure--key-functions)
  - [5. Prerequisites](#5-prerequisites)
  - [6. How to Run the Benchmark](#6-how-to-run-the-benchmark)
  - [7. Results and Analysis](#7-results-and-analysis)
  - [8. Conclusion](#8-conclusion)

---

## 1. Project Title
**GROUP-12-K1: NoSQL VS SQL Database Benchmarking**

---

## 2. Authors
| Name | NPM | Affiliation |
|------|-----|-------------|
| Abednego Zebua | 2306161883 | Computer Engineering 2023 |
| Raka Arrayan Muttaqien | 2306161800 | Computer Engineering 2023 |
| Wilman Saragih Sitio | 2306161776 | Computer Engineering 2023 |

---

## 3. Project Description
This project is an in-depth comparative analysis of PostgreSQL (SQL) and MongoDB (NoSQL) database performance within a university management system context. The primary aim is to empirically determine which database paradigm offers superior performance for various workload patterns, including basic CRUD operations, batch processing, complex data retrieval, and concurrent requests. We leverage Docker for containerization to ensure consistent and isolated testing environments across both database types and their respective Node.js/Express backends. The benchmark suite, orchestrated by Python scripts, automates the execution of diverse API tests, collects performance metrics (response times, success rates), and provides tools for data analysis and visualization to support robust conclusions.

### Tech Stack
<div align="center">

#### Backend & Runtime
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)

#### Database
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

#### Containerization
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)

#### Performance Test & Analysis
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![Matplotlib](https://img.shields.io/badge/Matplotlib-31045A?style=for-the-badge&logo=matplotlib&logoColor=white)](https://matplotlib.org/)
[![Seaborn](https://img.shields.io/badge/Seaborn-406F80?style=for-the-badge&logo=seaborn&logoColor=white)](https://seaborn.pydata.org/)

</div>

---

## 4. Project Base Model

### ERD (Conceptual)
The project's database model is conceptually based on a university system, featuring five core entities:
* **Users:** Stores general user information (username, email, password, role - student/admin).
* **Students:** Detailed student information (NIM, name, major, semester), linked to a User. This entity is extended with a `student_status` field for schema evolution tests.
* **Lecturers:** Information about teaching staff (name, NIDN, department).
* **Courses:** Details about academic courses (course code, name, credits, semester), linked to a Lecturer. This entity includes `capacity` for transactional tests and denormalized lecturer details for data locality tests.
* **Course Registrations:** Records linking students to courses, including academic year, semester of registration, and status.

### Docker Container Design
The entire benchmarking environment is orchestrated using `docker-compose.yml`. It defines and links the following services:
* **`postgres`**: The PostgreSQL database instance.
* **`backend-sql`**: The Node.js/Express application connected to PostgreSQL. It includes a `start.sh` script to ensure the database is ready and seeded before the application starts.
* **`mongo`**: The MongoDB database instance.
* **`backend-nosql`**: The Node.js/Express application connected to MongoDB.
The `docker-compose.yml` ensures that each backend connects to its respective database service using Docker's internal networking, and exposes the API ports (`3000` for SQL, `4000` for NoSQL) to the host machine.
![Docker Diagram](https://i.imgur.com/Wog1j7V.png) <!-- Re-inserted Docker Diagram URL -->

### Test Script Structure & Key Functions
The benchmarking is driven by a suite of Python scripts, all located in the `Benchmark/Python Benchmark/` directory:

* **`run_all_tests.py`**: The master runner script.
    * **Purpose:** Automates the entire benchmark process from Docker setup to executing all test scenarios sequentially. It manages Docker container lifecycle (build, start, intelligent stop).
    * **Key Function Prototype:**
        ```python
        def run_script(script_name: str) -> bool:
            # Runs a single Python test script as a subprocess.
            # Prints its output and returns True on success, False on failure.
        ```python
        # Main execution block in run_all_tests.py
        if __name__ == "__main__":
            # ... Docker setup and initial cleanup ...
            for script in test_scripts:
                if not run_script(script): # Executes each test script sequentially
                    # ... handles failure ...
            # ... Interactive Docker shutdown prompt ...
        ```

* **`performance_test.py`**: Conducts core CRUD, batch, complex query, and basic concurrency tests.
    * **Purpose:** Measures baseline performance for various data operations.
    * **Key Function Prototypes:**
        ```python
        def run_test_scenario(scenario_name: str, base_url: str, method: str, endpoint: str, data_generator=None, num_requests: int = 1, ids_to_use: list = None, **kwargs) -> tuple[list[dict], list[str]]:
            # Executes a given API test scenario (e.g., "Create User", "Get All Students").
            # Records response times, success status, and captures new IDs.
        ```python
        def run_batch_create_scenario(scenario_name: str, base_url: str, endpoint: str, data_generator, num_items: int, *args, **kwargs) -> tuple[list[dict], list[str]]:
            # Automates creating a batch of 'num_items' entities, recording total time and individual responses.
        ```python
        def run_batch_update_scenario(scenario_name: str, base_url: str, endpoint: str, data_generator, num_items: int, ids_to_update: list, **kwargs) -> tuple[list[dict], list]:
            # Updates a batch of existing entities, using provided IDs.
        ```python
        def run_batch_delete_scenario(scenario_name: str, base_url: str, endpoint: str, ids_to_delete: list) -> tuple[list[dict], list]:
            # Deletes a batch of existing entities by their IDs.
        ```python
        def run_concurrent_read_scenario(scenario_name: str, base_url: str, endpoint: str, num_concurrent_requests: int) -> list[dict]:
            # Simulates concurrent GET requests using a thread pool.
        ```python
        def cleanup_database(base_url: str) -> list[dict]:
            # Attempts to delete all dynamically created test data for a given backend URL.
        ```

* **`consistency_test.py`**: Focuses on transactional integrity and concurrency control.
    * **Purpose:** Specifically tests how each database handles concurrent updates to shared resources (e.g., course capacity) to ensure data consistency.
    * **Key Function Prototypes:**
        ```python
        def run_concurrent_registration_test(base_url: str, backend_type: str, num_concurrent_attempts: int, course_id: str, student_ids: list) -> tuple[list[dict], int, int]:
            # Simulates concurrent attempts to register students for a limited-capacity course.
            # Measures successful registrations and final course capacity.
        ```

* **`schema_evolution_test.py`**: Examines the impact and ease of schema changes.
    * **Purpose:** Compares SQL's DDL operations for adding fields against NoSQL's schema-less flexibility.
    * **Key Function Prototypes:**
        ```python
        def generate_student_data(user_id: str, random_id: str, student_status: str = None, for_nosql: bool = False) -> dict:
            # Generates student data, with an optional 'student_status' field for testing schema evolution.
        ```python
        # Main execution block in schema_evolution_test.py
        if __name__ == "__main__":
            # ... setup ...
            # Create students WITHOUT new status field
            # Measure read performance
            # Create students WITH new status field
            # Measure read performance
            # Update existing students to add new status field
            # Measure read performance after update
            # ... analysis and plotting ...
        ```

* **`data_locality_test.py`**: Compares performance benefits of data denormalization in NoSQL.
    * **Purpose:** Benchmarks read performance for queries that can leverage denormalized data in NoSQL versus normalized data (requiring joins/lookups).
    * **Key Function Prototypes:**
        ```python
        def generate_course_data(lecturer_id: str, random_id: str, capacity: int, prerequisites: list = None, for_nosql: bool = False, lecturer_name: str = None, lecturer_department: str = None) -> dict:
            # Generates course data, including optional denormalized lecturer fields for NoSQL.
        ```python
        # Main execution block in data_locality_test.py
        if __name__ == "__main__":
            # ... setup (creating denormalized courses in NoSQL) ...
            # Run queries:
            #   - SQL: Courses with Lecturer (via JOIN)
            #   - NoSQL: Courses with Lecturer (via $lookup)
            #   - NoSQL: Courses with Denormalized Lecturer (direct read)
            # ... analysis and plotting ...
        ```

---

## 5. Prerequisites

Before running the benchmark suite, ensure you have the following installed on your **host machine**:

* **[Python 3.x](https://www.python.org/downloads/)**: Download and install Python. Ensure "Add Python to PATH" is selected during installation.
* **pip**: Python's package installer, usually comes with Python.
* **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: Required for running all database and backend services in containers. Ensure it's installed and running.
* **Git**: For cloning the project repository (if applicable).
    * How to check: `git --version`
* **Required Python Libraries**: The Python scripts will attempt to install these automatically, but you can pre-install them in your terminal (run as administrator on Windows) to avoid issues:
    ```bash
    pip install requests pandas matplotlib seaborn
    ```

---

## 6. How to Run the Benchmark

The entire benchmark process is automated via the `run_all_tests.py` script.

1.  **Clone the Repository (if not already done):**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```
    (Replace `<your-repo-url>` and `<your-repo-name>` with your actual repository details if applicable).

2.  **Navigate to the Python Benchmark directory:**
    ```bash
    cd Benchmark/Python\ Benchmark/
    ```

3.  **Run the Master Test Runner Script:**
    ```bash
    python run_all_tests.py
    ```
    This script will:
    * Automatically stop and remove any existing Docker containers.
    * Rebuild all Docker images (`backend-sql`, `backend-nosql`, `postgres`, `mongo`) with the latest code.
    * Start all services in detached mode.
    * Execute `performance_test.py`, `consistency_test.py`, `schema_evolution_test.py`, and `data_locality_test.py` sequentially.
    * Print detailed test logs to your console.
    * Generate and display various performance plots.
    * **At the end, it will prompt you:** `Type 'end' to stop Docker containers and exit, or 'keep' to keep them running and exit script:`
        * Type `end` to gracefully shut down Docker services.
        * Type `keep` if you want to inspect logs or the running containers after the tests are done.

---

## 7. Results and Analysis

To ensure robust and representative results, the benchmark will be run on **3 different local machines**, with **3 iterations** performed on each machine. This multi-machine, multi-iteration approach helps:

* **Reduce Variance:** Mitigate the impact of background processes or temporary system load on a single machine.
* **Improve Confidence:** Increase confidence in the observed performance differences by confirming consistency across environments.
* **Account for Hardware Differences:** Provide a more generalized view of performance across typical local development setups.

From each test run (9 total runs: 3 machines \* 3 iterations/machine), the following data will be collected and analyzed:

* **Response Times (ms):** Average, Median, Min, Max, and Standard Deviation for individual requests in each scenario.
* **Total Times (ms):** For batch operations, measuring the cumulative time to complete a set of operations.
* **Success Rates (%):** The percentage of successful requests for each scenario, indicating the reliability and stability of each backend under test conditions.
* **Specific Metrics for Consistency Test:** Number of successful vs. failed concurrent registrations, and the final course capacity to verify transactional integrity.

The generated plots will visually represent these metrics, allowing for clear comparisons between SQL and NoSQL performance across the various workloads. Further analysis will involve comparing aggregated statistics across the multiple runs to identify consistent trends and highlight scenarios where one database excels or struggles relative to the other.

---

## 8. Conclusion
*(This section will be filled after the benchmark tests are completed and analyzed. It will summarize the key findings, discuss the strengths and weaknesses of each database based on the empirical data, and provide recommendations for specific use cases within a university management system.)*

</immersive>