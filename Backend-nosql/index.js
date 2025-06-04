require("dotenv").config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db'); // Assuming this connects to MongoDB
const helmet = require('helmet');
//const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./src/routes/UserRoute');
const courseRoutes = require('./src/routes/CourseRoute');
const studentRoutes = require('./src/routes/StudentRoute');
const courseRegRoute = require('./src/routes/CourseRegRoute');
const lecturerRoutes = require('./src/routes/LecturerRoute');


const port = process.env.PORT || 4000; // Default to 4000 for NoSQL
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
//app.use(xss()); // Keep commented out if not used
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
// ONLY apply if req.body exists and is not empty, and for methods that typically have a body
app.use((req, res, next) => {
    // Check if req.body exists and is an object, and if the method is one that typically has a body
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0 && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        // For students
        if (req.body.userId) req.body.user = req.body.userId;
        // For courses
        if (req.body.lecturerId) req.body.lecturer = req.body.lecturerId;
        if (req.body.prerequisiteIds) req.body.prerequisites = req.body.prerequisiteIds;
        // For course registrations
        if (req.body.studentId) req.body.student = req.body.studentId;
        if (req.body.courseId) req.body.course = req.body.courseId;
    }
    next();
});

// status endpoint
app.get('/status', (req, res) => {
    res.status(200).send({ status: "Server is running" });
});

// API routes
app.use('/user', userRoutes);
app.use('/users', userRoutes);

app.use('/student', studentRoutes);
app.use('/students', studentRoutes);

app.use('/lecturer', lecturerRoutes);
app.use('/lecturers', lecturerRoutes);

app.use('/course', courseRoutes);
app.use('/courses', courseRoutes);

app.use('/registration', courseRegRoute);
app.use('/course-registrations', courseRegRoute);

// Catch-all for undefined routes (404 Not Found)
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass to the error handling middleware
});

// Error handling middleware (MUST BE LAST)
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // If status was 200, it's now 500
    res.status(statusCode);
    res.json({
        success: false,
        message: err.message,
        // Include stack trace only in development for debugging
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});


app.listen(port, () => {
    console.log(`🚀 Server is running on PORT ${port}`);
})
