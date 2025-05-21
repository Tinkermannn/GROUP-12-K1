const lecturerRepository = require('../repositories/lecturer.repository');
const baseResponse = require('../utils/baseResponse.util');

exports.createLecturer = async (req, res, next) => {
    try {
        const { name, nidn, department } = req.body;
        
        // Validate required fields
        if (!name || !nidn || !department) {
            return baseResponse(res, false, 400, "Missing required fields", null);
        }
        
        // Check if NIDN already exists
        const existingLecturer = await lecturerRepository.findByNidn(nidn);
        if (existingLecturer) {
            return baseResponse(res, false, 400, "NIDN already registered", null);
        }
        
        // Create lecturer
        const lecturer = await lecturerRepository.createLecturer({
            name,
            nidn,
            department
        });
        
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
        const { name, nidn, department } = req.body;
        
        // Check if lecturer exists
        const existingLecturer = await lecturerRepository.getLecturerById(lecturerId);
        if (!existingLecturer) {
            return baseResponse(res, false, 404, "Lecturer not found", null);
        }
        
        // If NIDN is being changed, check if it's already used
        if (nidn && nidn !== existingLecturer.nidn) {
            const nidnExists = await lecturerRepository.findByNidn(nidn);
            if (nidnExists) {
                return baseResponse(res, false, 400, "NIDN already registered", null);
            }
        }
        
        // Update lecturer
        const updatedLecturer = await lecturerRepository.updateLecturer({
            id: lecturerId,
            name: name || existingLecturer.name,
            nidn: nidn || existingLecturer.nidn,
            department: department || existingLecturer.department
        });
        
        return baseResponse(res, true, 200, "Lecturer updated", updatedLecturer);
    } catch (error) {
        next(error);
    }
};

exports.deleteLecturer = async (req, res, next) => {
    try {
        const lecturerId = req.params.id;
        
        // Delete lecturer and get its data
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