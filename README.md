<div align="center">

# NoSQL VS SQL Database Benchmarking

</div>  

## Table of Contents
- [NoSQL VS SQL Database Benchmarking](#nosql-vs-sql-database-benchmarking)
  - [Table of Contents](#table-of-contents)
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
    - [Performance Test Results](#performance-test-results)
      - [Batch Operations Performance](#batch-operations-performance)
      - [Complex Queries Performance](#complex-queries-performance)
      - [Concurrent Requests Performance](#concurrent-requests-performance)
    - [Consistency Test Results](#consistency-test-results)
    - [Schema Evolution Test Results](#schema-evolution-test-results)
    - [Data Locality Test Results](#data-locality-test-results)
  - [8. Conclusion](#8-conclusion)

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

## Tech Stack
<div align="center">

### Backend & Runtime
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)

### Database
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

### Containerization
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)

### Performance Test & Analysis
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![Matplotlib](https://img.shields.io/badge/Matplotlib-31045A?style=for-the-badge&logo=matplotlib&logoColor=white)](https://matplotlib.org/)
[![Seaborn](https://img.shields.io/badge/Seaborn-406F80?style=for-the-badge&logo=seaborn&logoColor=white)](https://seaborn.pydata.org/)

</div>

---

# 4. Project Base Model

## ERD (Conceptual)
The project's database model is conceptually based on a university system, featuring five core entities:
* **Users:** Stores general user information (username, email, password, role - student/admin).
* **Students:** Detailed student information (NIM, name, major, semester), linked to a User. This entity is extended with a `student_status` field for schema evolution tests.
* **Lecturers:** Information about teaching staff (name, NIDN, department).
* **Courses:** Details about academic courses (course code, name, credits, semester), linked to a Lecturer. This entity includes `capacity` for transactional tests and denormalized lecturer details for data locality tests.
* **Course Registrations:** Records linking students to courses, including academic year, semester of registration, and status.
![ERD Diagram](https://i.imgur.com/g1Lx8mR.png)

## Docker Container Design
The entire benchmarking environment is orchestrated using `docker-compose.yml`. It defines and links the following services:
* **`postgres`**: The PostgreSQL database instance.
* **`backend-sql`**: The Node.js/Express application connected to PostgreSQL. It includes a `start.sh` script to ensure the database is ready and seeded before the application starts.
* **`mongo`**: The MongoDB database instance.
* **`backend-nosql`**: The Node.js/Express application connected to MongoDB.
    The `docker-compose.yml` ensures that each backend connects to its respective database service using Docker's internal networking, and exposes the API ports (`3000` for SQL, `4000` for NoSQL) to the host machine.
![Docker Diagram](https://i.imgur.com/Wog1j7V.png)

## Test Script Structure & Architecture

The benchmarking framework consists of five specialized Python scripts located in the `Benchmark/Python Benchmark/` directory. Each script serves a specific testing purpose and follows a consistent architectural pattern.

---

### Script Overview

| Script | Purpose | Key Focus |
|--------|---------|-----------|
| `master_test_runner.py` | Orchestration & automation | Docker lifecycle & test execution |
| `performance_test.py` | Core performance metrics | CRUD, batch, and concurrency testing |
| `consistency_test.py` | Data integrity validation | Transactional consistency & race conditions |
| `schema_evolution_test.py` | Schema flexibility analysis | DDL operations vs schema-less design |
| `data_locality_test.py` | Data organization comparison | Normalization vs denormalization benefits |

---


### 1. Master Test Runner (`master_test_runner.py`)

**Purpose**: **Automates the complete benchmark workflow from Docker container management** to sequential test execution.

**Key Responsibilities**:
- **Docker container lifecycle management (build, start, stop)**
- Sequential test script execution
- Error handling and recovery
- Interactive shutdown control

**Core Functions**:
```python
def run_script(script_name: str) -> bool:
    Executes a Python test script as subprocess
```
**Docker Management Implementation**:

```python
# Docker Environment Setup
def setup_docker_environment():
    ...    
    # Navigate to docker-compose.yml directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    docker_compose_dir = os.path.abspath(os.path.join(script_dir, os.pardir, os.pardir))
    
    try:
        # 1. Stop and remove existing containers
        subprocess.run(
            ["docker-compose", "down"], 
            cwd=docker_compose_dir, 
            check=True, 
            capture_output=True
        )
        print("Docker containers stopped and removed.")
        
        # 2. Rebuild and start containers in detached mode
        subprocess.run(
            ["docker-compose", "up", "--build", "-d"], 
            cwd=docker_compose_dir, 
            check=True, 
            capture_output=True
        )
        print("Docker containers rebuilt and started.")
        
        # 3. Wait for service stabilization
        time.sleep(15)
        print("Services should be ready.")
      ...
```
**Docker Cleanup**  
```python
def cleanup_docker_environment():
    Post-test Docker container cleanup
    print("\n--- Post-test Docker cleanup ---")
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        docker_compose_dir = os.path.abspath(os.path.join(script_dir, os.pardir, os.pardir))
        
        subprocess.run(
            ["docker-compose", "down"], 
            cwd=docker_compose_dir, 
            check=True, 
            capture_output=True
        )
    ...
```

**Execution Flow**:
```python
if __name__ == "__main__":
    # 1. Docker environment setup and cleanup
    # 2. Container image rebuilding
    # 3. Service startup in detached mode
    
    for script in test_scripts:
        if not run_script(script):
            # Handle execution failure
            break
    
    # 4. Interactive Docker shutdown prompt
```

---

#### 2. Performance Testing (`performance_test.py`)

**Purpose**: Measures baseline performance across various database operations and workload patterns.

**Test Categories**:
- **CRUD Operations**: Individual create, read, update, delete operations
- **Batch Processing**: Bulk operations with varying dataset sizes
- **Complex Queries**: Multi-table joins and data aggregation
- **Basic Concurrency**: Parallel request handling

**Core Functions**:
Execute API test scenario and collect performance metrics  
```python
def run_test_scenario(
    scenario_name: str, 
    base_url: str, 
    method: str, 
    endpoint: str, 
    data_generator=None, 
    num_requests: int = 1, 
    ids_to_use: list = None, 
    **kwargs
) -> tuple[list[dict], list[str]]:
```

Automate batch entity creation with performance tracking  
```python
def run_batch_create_scenario(
    scenario_name: str, 
    base_url: str, 
    endpoint: str, 
    data_generator, 
    num_items: int, 
    *args, 
    **kwargs
) -> tuple[list[dict], list[str]]:
```

Update batch of existing entities using provided IDs  
```python
def run_batch_update_scenario(
    scenario_name: str, 
    base_url: str, 
    endpoint: str, 
    data_generator, 
    num_items: int, 
    ids_to_update: list, 
    **kwargs
) -> tuple[list[dict], list]:
```

Delete batch of entities by their IDs  
```python
def run_batch_delete_scenario(
    scenario_name: str, 
    base_url: str, 
    endpoint: str, 
    ids_to_delete: list
) -> tuple[list[dict], list]:
```

Simulate concurrent GET requests using thread pool  
```python
def run_concurrent_read_scenario(
    scenario_name: str, 
    base_url: str, 
    endpoint: str, 
    num_concurrent_requests: int
) -> list[dict]:
```

Clean up all dynamically created test data  
```python
def cleanup_database(base_url: str) -> list[dict]:
```

---

#### 3. Consistency Testing (`consistency_test.py`)

**Purpose**: Validates transactional integrity and concurrent update handling to ensure data consistency under load.

**Test Focus**:
- Concurrent access to shared resources
- Transaction isolation levels
- Race condition detection
- Data integrity verification

**Core Functions**:  
Test concurrent student registration for limited-capacity course  
```python
def run_concurrent_registration_test(
    base_url: str, 
    backend_type: str, 
    num_concurrent_attempts: int, 
    course_id: str, 
    student_ids: list
) -> tuple[list[dict], int, int]:
```

---

#### 4. Schema Evolution Testing (`schema_evolution_test.py`)

**Purpose**: Compares the impact and flexibility of schema modifications between SQL DDL operations and NoSQL schema-less design.

**Test Scenarios**:
- Adding new fields to existing schemas
- Performance impact of schema changes
- Migration strategy comparison
- Backward compatibility assessment

**Core Functions**:  
Generate student data with optional schema evolution field  
```python
def generate_student_data(
    user_id: str, 
    random_id: str, 
    student_status: str = None, 
    for_nosql: bool = False
) -> dict:
```

**Test Execution Flow**:
```python
if __name__ == "__main__":
    # Phase 1: Baseline performance
    # - Create students WITHOUT new status field
    # - Measure read performance
    
    # Phase 2: Schema extension
    # - Create students WITH new status field
    # - Measure read performance impact
    
    # Phase 3: Migration testing
    # - Update existing students to add new status field
    # - Measure post-migration read performance
    
    # Phase 4: Analysis and visualization
    # - Generate performance comparison plots
    # - Statistical analysis of schema change impact
```

---

#### 5. Data Locality Testing (`data_locality_test.py`)

**Purpose**: Benchmarks the performance benefits of data denormalization in NoSQL versus normalized relational data structures.

**Comparison Scenarios**:
- **SQL**: Normalized data with JOINs
- **NoSQL**: Normalized data with `$lookup` operations  
- **NoSQL**: Denormalized data with direct access

**Core Functions**:  
Generate course data with optional denormalized lecturer information  
```python
def generate_course_data(
    lecturer_id: str, 
    random_id: str, 
    capacity: int, 
    prerequisites: list = None, 
    for_nosql: bool = False, 
    lecturer_name: str = None, 
    lecturer_department: str = None
) -> dict:
```

**Test Execution Flow**:
```python
if __name__ == "__main__":
    # Setup Phase:
    # - Create denormalized courses in NoSQL with embedded lecturer data
    # - Create normalized courses in SQL with lecturer references
    
    # Query Performance Testing:
    # 1. SQL: Courses with Lecturer (via JOIN operations)
    # 2. NoSQL: Courses with Lecturer (via $lookup aggregation)
    # 3. NoSQL: Courses with Denormalized Lecturer (direct field access)
    
    # Analysis Phase:
    # - Compare query response times across all three approaches
    # - Analyze trade-offs between storage overhead and query performance
    # - Generate comparative visualizations
```

---

### Execution Architecture

```
graph TD
    A[master_test_runner.py] --> B[Docker Setup]
    B --> C[performance_test.py]
    C --> D[consistency_test.py]
    D --> E[schema_evolution_test.py]
    E --> F[data_locality_test.py]
    F --> G[Results Analysis]
    G --> H[Interactive Cleanup]
```
# 5. Prerequisites

Before running the benchmark suite, ensure you have the following installed on your **host machine**:

* [**Python 3.x**](https://www.python.org/downloads/): Download and install Python. Ensure "Add Python to PATH" is selected during installation.
* **pip**: Python's package installer, usually comes with Python.
* [**Docker Desktop**](https://www.docker.com/products/docker-desktop/): Required for running all database and backend services in containers. Ensure it's installed and running.
* **Git**: For cloning the project repository (if applicable).
    * How to check: `git --version`
* **Required Python Libraries**: The Python scripts will attempt to install these automatically, but you can pre-install them in your terminal (run as administrator on Windows) to avoid issues:
    ```bash
    pip install requests pandas matplotlib seaborn
    ```

---

# 6. How to Run the Benchmark

The entire benchmark process is automated via the `master_test_runner.py` script.

1.  **Clone the Repository (if not already done):**
    ```bash
    git clone https://github.com/Tinkermannn/GROUP-12-K1.git
    cd GROUP-12-K1
    ```
2.  **Navigate to the Python Benchmark directory:**  
    **On Unix/Linux/macOS shell**
    ```bash
    cd Benchmark/Python\ Benchmark/
    ```
    **On Windows shell**
    ```bash
    cd "Benchmark\Python Benchmark"
    ```


3.  **Open Your Docker Desktop or activate your Docker Engine**
4.  **(Make sure the docker engine is running) Run the Master Test Runner Script:**
    ```bash
    python master_test_runner.py
    ``` 
    or  
    ```bash  
    python .\master_test_runner.py
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

# 7. Results and Analysis

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

## Performance Test Results
*(This section will contain the detailed results and analysis from `performance_test.py`)*

### Batch Operations Performance
*(graphs and analysis for Batch Create, Update, Delete here)*

### Complex Queries Performance
*(graphs and analysis for Students with Details & Courses, Courses with Lecturer & Prerequisites, Lecturers with Course Count here)*

### Concurrent Requests Performance
*(graphs and analysis for Concurrent Get All Users, Concurrent Complex Query: Students with Details & Courses here)*

## Consistency Test Results
*(This section will contain the detailed results and analysis from `consistency_test.py`)*
Coming Soon - Results will be added after successful execution and data collection.

## Schema Evolution Test Results
*(This section will contain the detailed results and analysis from `schema_evolution_test.py`)*
Coming Soon - Results will be added after successful execution and data collection.

## Data Locality Test Results
*(This section will contain the detailed results and analysis from `data_locality_test.py`)*
Coming Soon - Results will be added after successful execution and data collection.

---

# 8. Conclusion
*(This section will be filled after the benchmark tests are completed and analyzed. It will summarize the key findings, discuss the strengths and weaknesses of each database based on the empirical data, and provide recommendations for specific use cases within a university management system.)*
