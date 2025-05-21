const mongoose = require('mongoose');

const lecturerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        nidn: {
            type: String,
            required: true,
            unique: true,
        },
        department: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const Lecturer = mongoose.model("Lecturer", lecturerSchema);
module.exports = Lecturer;
