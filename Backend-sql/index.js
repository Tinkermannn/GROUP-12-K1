const express = require("express");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;

const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');

app.use(rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 1000,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
        payload: null
    }
}));

const userRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5000,
    keyGenerator: (req) => {
        try {
            return req.user?.id || req.ip;
        } catch {
            return req.ip;
        }
    }
});

app.use(cors({
    origin: [],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));



app.use(helmet());

app.use(express.json());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const userRoutes = require('./src/routes/user.route');
const studentRoutes = require('./src/routes/student.route');
const lecturerRoutes = require('./src/routes/lecturer.route');
const courseRoutes = require('./src/routes/course.route');
const courseRegistrationRoutes = require('./src/routes/coursereg.route');

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

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
        payload: null
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
