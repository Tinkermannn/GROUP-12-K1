const CourseRegistration = require("../models/CourseRegModel"); // ✅ ini diperbaiki
const Student = require("../models/StudentModel");
const Course = require("../models/CourseModel");

async function createCourseRegistration(req, res) {
    try {
        const { studentId, courseId, academic_year, semester } = req.body;

        // Validasi input
        if (!studentId || !courseId || !academic_year || !semester) {
            throw new Error("All fields (studentId, courseId, academic_year, semester) are required");
        }

        // Cek apakah student dan course ada
        const studentExist = await Student.exists({ _id: studentId });
        const courseExist = await Course.exists({ _id: courseId });

        if (!studentExist) throw new Error("Student not found");
        if (!courseExist) throw new Error("Course not found");

        // Buat course registration baru
        const newRegistration = new CourseRegistration({
            student: studentId,
            course: courseId,
            academic_year,
            semester
        });

        const savedRegistration = await newRegistration.save();

        // Update student dengan course registration baru
        await Student.updateOne(
            { _id: studentId },
            { $push: { courses: savedRegistration._id } }
        );

        res.status(201).json({
            success: true,
            message: "Course registration successful",
            data: savedRegistration,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function getAllCourseRegistrations(req, res) {
    try {
        const registrations = await CourseRegistration.find()
            .populate("student")
            .populate("course")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: registrations,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function getCourseRegistrationById(req, res) {
    try {
        const registration = await CourseRegistration.findById(req.params.id)
            .populate("student")
            .populate("course");

        if (!registration) throw new Error("Course registration not found");

        res.status(200).json({
            success: true,
            data: registration,
        });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
}

async function updateCourseRegistration(req, res) {
    try {
        const updatedRegistration = await CourseRegistration.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: updatedRegistration,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function deleteCourseRegistration(req, res) {
    try {
        const registration = await CourseRegistration.findById(req.params.id);
        if (!registration) throw new Error("Registration not found");

        await CourseRegistration.findByIdAndDelete(req.params.id);

        await Student.updateOne(
            { _id: registration.student },
            { $pull: { courses: req.params.id } }
        );

        res.status(200).json({
            success: true,
            message: "Course registration deleted",
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

module.exports = {
    createCourseRegistration,
    getAllCourseRegistrations,
    getCourseRegistrationById,
    updateCourseRegistration,
    deleteCourseRegistration,
};
