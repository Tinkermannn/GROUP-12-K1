-- Create custom enum types for PostgreSQL
CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE semester_type AS ENUM ('Ganjil', 'Genap');
CREATE TYPE registration_status AS ENUM ('registered', 'dropped', 'approved');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    nim VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    major VARCHAR(255) NOT NULL,
    semester INTEGER NOT NULL,
    student_status VARCHAR(50) DEFAULT 'active', -- NEW FIELD ADDED HERE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Lecturers table
CREATE TABLE lecturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nidn VARCHAR(255) NOT NULL UNIQUE,
    department VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    credits INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    lecturer_id INTEGER NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0, -- Added capacity
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturer_id) REFERENCES lecturers(id)
);

-- Course prerequisites (many-to-many relationship)
CREATE TABLE course_prerequisites (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    prerequisite_course_id INTEGER NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE (course_id, prerequisite_course_id)
);

-- Course registrations table
CREATE TABLE course_registrations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    academic_year VARCHAR(255) NOT NULL,
    semester semester_type NOT NULL,
    status registration_status DEFAULT 'registered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Seed users (password is bcrypt hash for 'password123')
INSERT INTO users (username, email, password, role)
VALUES
    ('student1', 'student1@example.com', '$2b$10$wHk1Z5n2QnQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQw', 'student'),
    ('student2', 'student2@example.com', '$2b$10$wHk1Z5n2QnQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQw', 'student'),
    ('admin1', 'admin1@example.com', '$2b$10$wHk1Z5n2QnQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQw', 'admin');

-- Seed lecturers
INSERT INTO lecturers (name, nidn, department)
VALUES
    ('Dr. John Doe', '12345678', 'Computer Science'),
    ('Dr. Jane Smith', '87654321', 'Information Systems');

-- Seed students (user_id must match users above)
INSERT INTO students (user_id, nim, name, major, semester, student_status) -- Added student_status
VALUES
    (1, '20210001', 'Alice', 'Computer Science', 1, 'active'), -- Added student_status
    (2, '20210002', 'Bob', 'Information Systems', 2, 'active'); -- Added student_status

-- Seed courses (lecturer_id must match lecturers above)
INSERT INTO courses (course_code, name, credits, semester, lecturer_id, capacity) -- Added capacity
VALUES
    ('CS101', 'Intro to Computer Science', 3, 1, 1, 50), -- Added capacity
    ('CS102', 'Data Structures', 3, 2, 1, 40), -- Added capacity
    ('IS201', 'Intro to Information Systems', 3, 1, 2, 60); -- Added capacity

-- Seed course prerequisites (CS102 requires CS101)
INSERT INTO course_prerequisites (course_id, prerequisite_course_id)
VALUES
    (2, 1);

-- Seed course registrations (student_id, course_id, academic_year, semester, status)
INSERT INTO course_registrations (student_id, course_id, academic_year, semester, status)
VALUES
    (1, 1, '2024/2025', 'Ganjil', 'registered'),
    (1, 2, '2024/2025', 'Genap', 'registered'),
    (2, 3, '2024/2025', 'Ganjil', 'approved');
