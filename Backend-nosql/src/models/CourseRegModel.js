const mongoose = require('mongoose');

const courseRegistrationSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        academic_year: {
            type: String,
            required: true,
        },
        semester: {
            type: String, // Assuming 'Ganjil' or 'Genap'
            enum: ['Ganjil', 'Genap'], // Add enum for validation if applicable
            required: true,
        },
        status: {
            type: String,
            enum: ['registered', 'dropped', 'approved'],
            default: 'registered',
        },
    },
    { timestamps: true }
);

const CourseRegistration = mongoose.model("CourseRegistration", courseRegistrationSchema);
module.exports = CourseRegistration;
