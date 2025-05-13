const Course = require("../models/CourseModel");

async function createCourse(req, res) {
    try {
        const { course_code, name, credits, semester, lecturer, prerequisites } = req.body;

        // Validasi minimal field wajib
        if (!course_code || !name || !credits || !semester || !lecturer) {
            throw new Error("Missing required fields");
        }

        let validatedPrereqs = [];

        // Jika ada prerequisites, validasi apakah ID-nya valid
        if (prerequisites && prerequisites.length > 0) {
            const foundPrereqs = await Course.find({ _id: { $in: prerequisites } });

            if (foundPrereqs.length !== prerequisites.length) {
                throw new Error("One or more prerequisite course IDs are invalid");
            }

            validatedPrereqs = prerequisites;
        }

        // Buat course baru
        const course = new Course({
            course_code,
            name,
            credits,
            semester,
            lecturer,
            prerequisites: validatedPrereqs,
        });

        const saved = await course.save();

        // Populate prerequisites
        const populatedCourse = await Course.findById(saved._id)
            .populate("lecturer")
            .populate("prerequisites");

        res.status(201).json({ success: true, data: populatedCourse });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function getAllCourses(req, res) {
    try {
        const courses = await Course.find()
            .populate("lecturer")
            .populate("prerequisites")
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: courses });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function getCourseById(req, res) {
    try {
        const course = await Course.findById(req.params.id)
            .populate("lecturer")
            .populate("prerequisites");

        if (!course) throw new Error("Course not found");

        res.status(200).json({ success: true, data: course });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
}

async function updateCourse(req, res) {
    try {
        const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate("lecturer")
            .populate("prerequisites");

        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function deleteCourse(req, res) {
    try {
        // Ambil data course
        const course = await Course.findById(req.params.id).populate("lecturer").populate("prerequisites");
        if (!course) throw new Error("Course not found");

        // Hapus course
        await Course.findByIdAndDelete(req.params.id);

        // Show course yang dihapus
        res.status(200).json({ success: true, message: "Course deleted", data: course });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}


module.exports = { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse };
