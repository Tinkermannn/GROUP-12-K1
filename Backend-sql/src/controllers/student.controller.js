const studentRepository = require('../repositories/student.repository');
const baseResponse = require('../utils/baseResponse.util');

exports.createStudent = async (req, res, next) => {
    try {
        const { user_id, nim, name, major, semester } = req.body;
        
        // Validate required fields
        if (!user_id || !nim || !name || !major || !semester) {
            return baseResponse(res, false, 400, "Missing required fields", null);
        }
        
        // Check if user exists
        const userExists = await studentRepository.checkUserExists(user_id);
        if (!userExists) {
            return baseResponse(res, false, 400, "User not found", null);
        }
        
        // Check if NIM already exists
        const nimExists = await studentRepository.findByNim(nim);
        if (nimExists) {
            return baseResponse(res, false, 400, "NIM already registered", null);
        }
        
        // Create student
        const student = await studentRepository.createStudent({
            user_id,
            nim,
            name,
            major,
            semester
        });
        
        return baseResponse(res, true, 201, "Student created", student);
    } catch (error) {
        next(error);
    }
};

exports.getAllStudents = async (req, res, next) => {
    try {
        const students = await studentRepository.getAllStudents();
        return baseResponse(res, true, 200, "Students fetched", students);
    } catch (error) {
        next(error);
    }
};

exports.getStudentById = async (req, res, next) => {
    try {
        const student = await studentRepository.getStudentById(req.params.id);
        
        if (student) {
            return baseResponse(res, true, 200, "Student found", student);
        } else {
            return baseResponse(res, false, 404, "Student not found", null);
        }
    } catch (error) {
        next(error);
    }
};

exports.updateStudent = async (req, res, next) => {
    try {
        const studentId = req.params.id;
        
        // Check if student exists
        const existingStudent = await studentRepository.getStudentById(studentId);
        if (!existingStudent) {
            return baseResponse(res, false, 404, "Student not found", null);
        }
        
        // If NIM is being changed, check if it's already used
        if (req.body.nim && req.body.nim !== existingStudent.nim) {
            const nimExists = await studentRepository.findByNim(req.body.nim);
            if (nimExists) {
                return baseResponse(res, false, 400, "NIM already registered", null);
            }
        }
        
        // Update student
        const updatedStudent = await studentRepository.updateStudent({
            id: studentId,
            ...req.body
        });
        
        return baseResponse(res, true, 200, "Student updated", updatedStudent);
    } catch (error) {
        next(error);
    }
};

exports.deleteStudent = async (req, res, next) => {
    try {
        const studentId = req.params.id;
        
        // Delete student and get its data
        const deletedStudent = await studentRepository.deleteStudent(studentId);
        
        if (deletedStudent) {
            return baseResponse(res, true, 200, "Student deleted", deletedStudent);
        } else {
            return baseResponse(res, false, 404, "Student not found", null);
        }
    } catch (error) {
        next(error);
    }
};