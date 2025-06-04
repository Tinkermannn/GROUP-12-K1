const lecturerRepository = require('../repositories/lecturer.repository');
const baseResponse = require('../utils/baseResponse.util');

exports.createLecturer = async (req, res, next) => {
    try {
        const { name, nidn, department } = req.body;
        if (!name || !nidn || !department) {
            return baseResponse(res, false, 400, "Missing required fields", null);
        }
        const nidnExists = await lecturerRepository.getLecturerById(nidn); // Assuming NIDN is unique and can be used for lookup
        if (nidnExists) {
            return baseResponse(res, false, 400, "NIDN already registered", null);
        }
        const lecturer = await lecturerRepository.createLecturer({ name, nidn, department });
        return baseResponse(res, true, 201, "Lecturer created", lecturer);
    } catch (error) {
        next(error);
    }
};

exports.getAllLecturers = async (req, res, next) => {
    try {
        const lecturers = await lecturerRepository.getAllLecturers();
        return baseResponse(res, true, 200, "Lecturers fetched", lecturers);
    } catch (error) {
        next(error);
    }
};

exports.getLecturerById = async (req, res, next) => {
    try {
        const lecturer = await lecturerRepository.getLecturerById(req.params.id);
        if (lecturer) {
            return baseResponse(res, true, 200, "Lecturer found", lecturer);
        } else {
            return baseResponse(res, false, 404, "Lecturer not found", null);
        }
    } catch (error) {
        next(error);
    }
};

exports.updateLecturer = async (req, res, next) => {
    try {
        const lecturerId = req.params.id;
        const existingLecturer = await lecturerRepository.getLecturerById(lecturerId);
        if (!existingLecturer) {
            return baseResponse(res, false, 404, "Lecturer not found", null);
        }
        const updatedLecturer = await lecturerRepository.updateLecturer({ id: lecturerId, ...req.body });
        return baseResponse(res, true, 200, "Lecturer updated", updatedLecturer);
    } catch (error) {
        next(error);
    }
};

exports.deleteLecturer = async (req, res, next) => {
    try {
        const lecturerId = req.params.id;
        const deletedLecturer = await lecturerRepository.deleteLecturer(lecturerId);
        if (deletedLecturer) {
            return baseResponse(res, true, 200, "Lecturer deleted", deletedLecturer);
        } else {
            return baseResponse(res, false, 404, "Lecturer not found", null);
        }
    } catch (error) {
        next(error);
    }
};

// NEW COMPLEX QUERY: Get All Lecturers with Course Count
exports.getLecturersWithCourseCount = async (req, res, next) => {
    try {
        const lecturers = await lecturerRepository.getLecturersWithCourseCount();
        return baseResponse(res, true, 200, "Lecturers with course count fetched", lecturers);
    } catch (error) {
        next(error);
    }
};
