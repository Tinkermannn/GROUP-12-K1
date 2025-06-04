const Lecturer = require("../models/LecturerModel"); // Assuming you have a LecturerModel.js
const Course = require("../models/CourseModel"); // Assuming you have a CourseModel.js

async function createLecturer(req, res) {
    try {
        const lecturer = new Lecturer(req.body);
        const saved = await lecturer.save();
        res.status(201).json({ success: true, data: saved });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function getAllLecturers(req, res) {
    try {
        const lecturers = await Lecturer.find().sort({ updatedAt: -1 });
        res.status(200).json({ success: true, data: lecturers });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function getLecturerById(req, res) {
    try {
        const lecturer = await Lecturer.findById(req.params.id);
        if (!lecturer) throw new Error("Lecturer not found");
        res.status(200).json({ success: true, data: lecturer });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
}

async function updateLecturer(req, res) {
    try {
        const updated = await Lecturer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function deleteLecturer(req, res) {
    try {
        const lecturer = await Lecturer.findByIdAndDelete(req.params.id);
        if (!lecturer) throw new Error("Lecturer not found");
        res.status(200).json({ success: true, message: "Lecturer deleted", data: lecturer });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// NEW COMPLEX QUERY: Get All Lecturers with Course Count
async function getLecturersWithCourseCount(req, res) {
    try {
        const lecturers = await Lecturer.aggregate([
            {
                $lookup: {
                    from: 'courses', // The collection to join with
                    localField: '_id', // Field from the input documents (lecturers)
                    foreignField: 'lecturer', // Field from the "from" documents (courses)
                    as: 'coursesTaught' // Output array field
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    nidn: 1,
                    department: 1,
                    course_count: { $size: '$coursesTaught' } // Count the size of the joined array
                }
            },
            {
                $sort: { name: 1 }
            }
        ]);
        res.status(200).json({ success: true, data: lecturers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    createLecturer,
    getAllLecturers,
    getLecturerById,
    updateLecturer,
    deleteLecturer,
    getLecturersWithCourseCount // Export the new function
};
