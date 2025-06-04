#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER"; do # <--- Changed DB_HOST, DB_PORT, DB_USER
    echo "PostgreSQL is unavailable - sleeping"
    sleep 1
done
echo "PostgreSQL is up and running!"

echo "Cleaning database tables for testing..."
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" <<-EOF # <--- Changed DB_PASSWORD, DB_HOST, DB_PORT, DB_USER, DB_NAME
TRUNCATE TABLE course_registrations RESTART IDENTITY CASCADE;
TRUNCATE TABLE courses RESTART IDENTITY CASCADE;
TRUNCATE TABLE lecturers RESTART IDENTITY CASCADE;
TRUNCATE TABLE students RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
EOF
echo "Database tables truncated."

echo "Starting SQL backend application..."
# Assuming your Node.js app's start command in Backend-sql is 'npm start'
npm start