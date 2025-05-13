const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        course_code: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        credits: {
            type: Number,
            required: true,
        },
        semester: {
            type: Number,
            required: true,
        },
        lecturer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lecturer",
            required: true,
        },
        prerequisites: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course",
            },
        ],
    },
    { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);
module.exports = Course;
