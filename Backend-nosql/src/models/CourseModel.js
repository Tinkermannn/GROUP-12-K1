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
            type: Number, // Assuming semester is a number like 1 or 2
            required: true,
        },
        lecturer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lecturer", // Reference to Lecturer model
            required: true,
        },
        prerequisites: [ // Array of ObjectIds referencing other courses
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
