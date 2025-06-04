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
        capacity: {
            type: Number,
            required: true,
            default: 0
        },
        lecturer_name_denormalized: { // NEW FIELD: Denormalized lecturer name
            type: String,
            required: false // Optional, as it's a denormalized field
        },
        lecturer_department_denormalized: { // NEW FIELD: Denormalized lecturer department
            type: String,
            required: false // Optional
        }
    },
    { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);
module.exports = Course;
