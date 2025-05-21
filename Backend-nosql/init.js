db = db.getSiblingDB('benchmarkdb');

// Users
db.users.insertMany([
    {
        username: "student1",
        email: "student1@example.com",
        password: "$2b$10$wHk1Z5n2QnQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQw", // bcrypt for 'password123'
        role: "student"
    },
    {
        username: "student2",
        email: "student2@example.com",
        password: "$2b$10$wHk1Z5n2QnQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQw", // bcrypt for 'password123'
        role: "student"
    },
    {
        username: "admin1",
        email: "admin1@example.com",
        password: "$2b$10$wHk1Z5n2QnQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQw", // bcrypt for 'password123'
        role: "admin"
    }
]);

// Lecturers
db.lecturers.insertMany([
    { name: "Dr. John Doe", nidn: "12345678", department: "Computer Science" },
    { name: "Dr. Jane Smith", nidn: "87654321", department: "Information Systems" }
]);

// Students (reference user _id)
const user1 = db.users.findOne({ username: "student1" });
const user2 = db.users.findOne({ username: "student2" });

db.students.insertMany([
    { user: user1._id, nim: "20210001", name: "Alice", major: "Computer Science", semester: 1 },
    { user: user2._id, nim: "20210002", name: "Bob", major: "Information Systems", semester: 2 }
]);

// Courses (reference lecturer _id)
const lecturer1 = db.lecturers.findOne({ nidn: "12345678" });
const lecturer2 = db.lecturers.findOne({ nidn: "87654321" });

const cs101 = db.courses.insertOne({
    course_code: "CS101",
    name: "Intro to Computer Science",
    credits: 3,
    semester: 1,
    lecturer: lecturer1._id,
    prerequisites: []
});
const cs102 = db.courses.insertOne({
    course_code: "CS102",
    name: "Data Structures",
    credits: 3,
    semester: 2,
    lecturer: lecturer1._id,
    prerequisites: [cs101.insertedId]
});
const is201 = db.courses.insertOne({
    course_code: "IS201",
    name: "Intro to Information Systems",
    credits: 3,
    semester: 1,
    lecturer: lecturer2._id,
    prerequisites: []
});

// Course Registrations (reference student and course _id)
const student1 = db.students.findOne({ nim: "20210001" });
const student2 = db.students.findOne({ nim: "20210002" });

db.courseregs.insertMany([
    { student: student1._id, course: cs101.insertedId, academic_year: "2024/2025", semester: "Ganjil", status: "registered" },
    { student: student1._id, course: cs102.insertedId, academic_year: "2024/2025", semester: "Genap", status: "registered" },
    { student: student2._id, course: is201.insertedId, academic_year: "2024/2025", semester: "Ganjil", status: "approved" }
]);