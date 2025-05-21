require("dotenv").config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./src/routes/UserRoute');
const courseRoutes = require('./src/routes/CourseRoute');
const studentRoutes = require('./src/routes/StudentRoute');
const courseRegRoutes = require('./src/routes/CourseRegRoute');
const lecturerRoutes = require('./src/routes/LecturerRoute');


const port = process.env.PORT;
const app = express();




// connect to database
db.connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        methods: "GET,POST,PUT,DELETE",
        credentials: true
    })
);

app.use(helmet());
app.use(xss());
app.use(rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 1000,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
        payload: null
    }
}));

// Middleware to map camelCase IDs to backend field names
app.use((req, res, next) => {
    // For students
    if (req.body.userId) req.body.user = req.body.userId;
    // For courses
    if (req.body.lecturerId) req.body.lecturer = req.body.lecturerId;
    if (req.body.prerequisiteIds) req.body.prerequisites = req.body.prerequisiteIds;
    // For course registrations
    if (req.body.studentId) req.body.student = req.body.studentId;
    if (req.body.courseId) req.body.course = req.body.courseId;
    next();
});

// status
app.get('/status', (req, res) => {
    res.status(200).send({ status: "Server is running" });
})

app.use('/user', userRoutes);
app.use('/users', userRoutes);

app.use('/student', studentRoutes);
app.use('/students', studentRoutes);

app.use('/lecturer', lecturerRoutes);
app.use('/lecturers', lecturerRoutes);

app.use('/course', courseRoutes);
app.use('/courses', courseRoutes);

app.use('/registration', courseRegistrationRoutes);
app.use('/course-registrations', courseRegistrationRoutes);


app.listen(port, () => {
    console.log(`🚀 Server is running on PORT ${port}`);
})