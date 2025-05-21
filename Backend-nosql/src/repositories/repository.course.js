const Course = require("../models/CourseModel");

async function createCourse(req, res) {
    try {
        const course = new Course(req.body);
        const saved = await course.save();
        res.status(201).json({ success: true, data: saved });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function getAllCourses(req, res) {
    try {
        const courses = await Course.find().populate("lecturer").sort({ updatedAt: -1 });
        res.status(200).json({ success: true, data: courses });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function getCourseById(req, res) {
    try {
        const course = await Course.findById(req.params.id).populate("lecturer");
        if (!course) throw new Error("Course not found");
        res.status(200).json({ success: true, data: course });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
}

async function updateCourse(req, res) {
    try {
        const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function deleteCourse(req, res) {
    try {
        // Ambil data course terlebih dahulu
        const course = await Course.findById(req.params.id).populate("lecturer");
        if (!course) throw new Error("Course not found");

        // Hapus course
        await Course.findByIdAndDelete(req.params.id);

        // Tampilkan course yang dihapus
        res.status(200).json({ success: true, message: "Course deleted", data: course });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}


module.exports = { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse };
