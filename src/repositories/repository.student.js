const Student = require("../models/StudentModel");

async function createStudent(req, res) {
    try {
        const student = new Student(req.body);
        const saved = await student.save();
        res.status(201).json({ success: true, data: saved });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function getAllStudents(req, res) {
    try {
        const students = await Student.find().populate("user").sort({ updatedAt: -1 });
        res.status(200).json({ success: true, data: students });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function getStudentById(req, res) {
    try {
        const student = await Student.findById(req.params.id).populate("user");
        if (!student) throw new Error("Student not found");
        res.status(200).json({ success: true, data: student });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
}

async function updateStudent(req, res) {
    try {
        const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function deleteStudent(req, res) {
    try {
        // Temukan data student terlebih dahulu
        const student = await Student.findById(req.params.id).populate("user");
        if (!student) throw new Error("Student not found");

        // Hapus student
        await Student.findByIdAndDelete(req.params.id);

        // Kirim respons dengan data yang telah dihapus
        res.status(200).json({ success: true, message: "Student deleted", data: student });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}


module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent };
