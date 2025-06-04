const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        nim: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        major: {
            type: String,
            required: true,
        },
        semester: {
            type: Number,
            required: true,
        },
        student_status: { // NEW FIELD: Student status
            type: String,
            default: 'active'
        }
    },
    { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;
