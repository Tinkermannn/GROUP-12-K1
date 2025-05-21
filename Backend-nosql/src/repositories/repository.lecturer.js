const Lecturer = require("../models/LecturerModel");

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
        // Ambil data dosen sebelum dihapus
        const lecturer = await Lecturer.findById(req.params.id);
        if (!lecturer) throw new Error("Lecturer not found");

        // Hapus dosen
        await Lecturer.findByIdAndDelete(req.params.id);

        // Tampilkan data dosen yang dihapus
        res.status(200).json({ success: true, message: "Lecturer deleted", data: lecturer });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}


module.exports = { createLecturer, getAllLecturers, getLecturerById, updateLecturer, deleteLecturer };
