# 🚀 Fullstack Benchmarking Environment Guide

This guide will help you set up and run the entire benchmarking environment for both SQL and NoSQL backends, including databases, APIs, and automated API benchmarks.

---

## 1. Prerequisites

Before you start, make sure you have these installed:

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**  
  For running all services (PostgreSQL, MongoDB, both backends) in containers.

- **[Node.js (LTS version, e.g., 18.x or 20.x)](https://nodejs.org/)**  
  For running backend code and Newman (API benchmark runner).

- **[npm](https://www.npmjs.com/)**  
  Comes with Node.js, used for installing dependencies.

- **[Python 3.x](https://www.python.org/downloads/)**  
  For summarizing benchmark results.

- **[Newman](https://www.npmjs.com/package/newman)**  
  CLI tool to run Postman collections. Install globally:
  ```sh
  npm install -g newman
  ```

- **(Optional) [Postman](https://www.postman.com/downloads/)**  
  For manual API testing and editing collections.

---

## 2. Project Structure Overview

```
project-root/
│
├── Backend-sql/         # SQL backend (PostgreSQL)
├── Backend-nosql/       # NoSQL backend (MongoDB)
├── Benchmark/           # Postman collections, envs, scripts
├── docker-compose.yml   # Orchestrates all services
├── README.md            # This guide
```

---

## 3. Configuration

- **Environment Variables:**  
  Each backend has its own `.env` file.  
  These are loaded automatically by Docker Compose.

- **Seed Data:**  
  - SQL: `Backend-sql/dump.sql`
  - NoSQL: `Backend-nosql/init.js`

---

## 4. [ONLY DO THIS IF YOURE NOT USING DOCKER] Install Dependencies

From the project root, run:

```sh
cd Backend-sql
npm install

cd ../Backend-nosql
npm install
```

---

## 5. Build and Start All Services

From the project root, run:

```sh
docker-compose up --build
```

- This will build and start:
  - PostgreSQL and MongoDB databases
  - Both backend APIs (SQL on port 3000, NoSQL on port 4000)
  - Seed the databases with initial data

---

## 6. Testing the Setup

- **Check containers:**  
  ```sh
  docker ps
  ```
  You should see `postgres`, `mongo`, `backend-sql`, and `backend-nosql` running.

- **Test APIs:**  
  - SQL: [http://localhost:3000](http://localhost:3000)
  - NoSQL: [http://localhost:4000](http://localhost:4000)
  - Use Postman or curl to test endpoints.

- **Check logs:**  
  ```sh
  docker-compose logs
  ```

- **Access PostgreSQL shell:**  
  ```sh
  docker exec -it <postgres_container_name> psql -U benchmarkuser -d benchmarkdb
  ```

- **Access MongoDB shell:**  
  ```sh
  docker exec -it <mongo_container_name> mongosh
  ```

---

## 7. Running Benchmarks

1. **Navigate to the Benchmark folder:**
   ```sh
   cd Benchmark/Newman\ Bulk\ API\ Tests
   ```

2. **Run the SQL benchmark:**
   ```sh
   run-tests-sql.bat
   ```
   or, manually:
   ```sh
   newman run collection.json -e env-sql.json -r cli,json --reporter-json-export sql_result.json
   ```

3. **Run the NoSQL benchmark:**
   ```sh
   run-tests-nosql.bat
   ```
   or, manually:
   ```sh
   newman run collection.json -e env-nosql.json -r cli,json --reporter-json-export nosql_result.json
   ```

4. **Summarize results:**
   ```sh
   python summarize_newman.py
   ```

---

## 8. Stopping and Resetting

- **Stop all containers:**
  ```sh
  docker-compose down
  ```

- **Reset all data (fresh start):**
  ```sh
  docker-compose down -v
  docker-compose up --build
  ```

---

## 9. Troubleshooting

- **Database connection errors:**  
  Ensure `.env` files use `postgres` and `mongo` as hosts (not `localhost`).

- **Schema or seed data not loaded:**  
  Make sure `dump.sql` and `init.js` are correctly mounted and formatted.

- **Port conflicts:**  
  Change the `ports` mapping in `docker-compose.yml` if 5432, 27017, 3000, or 4000 are in use.

- **Check logs for errors:**  
  ```sh
  docker-compose logs
  ```

---

## 10. Notes

- All data is stored in containers. Use Docker volumes if you want to persist data between runs.
- For a clean slate, always use `docker-compose down -v` before `up --build`.

---