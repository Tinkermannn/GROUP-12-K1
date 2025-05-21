const courseRegistrationRepository = require('../repositories/coursereg.repository');
const baseResponse = require('../utils/baseResponse.util');

exports.createCourseRegistration = async (req, res, next) => {
    try {
        const { studentId, courseId, academic_year, semester } = req.body;

        // Validate input
        if (!studentId || !courseId || !academic_year || !semester) {
            return baseResponse(res, false, 400, "All fields (studentId, courseId, academic_year, semester) are required", null);
        }

        // Check if student and course exist
        const studentExists = await courseRegistrationRepository.studentExists(studentId);
        if (!studentExists) {
            return baseResponse(res, false, 400, "Student not found", null);
        }

        const courseExists = await courseRegistrationRepository.courseExists(courseId);
        if (!courseExists) {
            return baseResponse(res, false, 400, "Course not found", null);
        }

        // Get course prerequisites
        const prerequisites = await courseRegistrationRepository.getPrerequisitesForCourse(courseId);
        
        // Check if all prerequisites have been approved
        const approvedCourseIds = await courseRegistrationRepository.findApprovedCoursesByStudentId(studentId);
        
        const unmetPrereqs = prerequisites.filter(prereq => 
            !approvedCourseIds.includes(prereq.id)
        );

        if (unmetPrereqs.length > 0) {
            return baseResponse(res, false, 400, "Cannot register. Prerequisite courses not yet passed.", {
                missing: unmetPrereqs.map(prereq => prereq.name)
            });
        }

        // Create the registration
        const newRegistration = await courseRegistrationRepository.createCourseRegistration({
            student_id: studentId,
            course_id: courseId,
            academic_year,
            semester
        });

        return baseResponse(res, true, 201, "Course registration successful", newRegistration);
    } catch (error) {
        next(error);
    }
};

exports.getAllCourseRegistrations = async (req, res, next) => {
    try {
        const registrations = await courseRegistrationRepository.getAllCourseRegistrations();
        return baseResponse(res, true, 200, "Course registrations fetched", registrations);
    } catch (error) {
        next(error);
    }
};

exports.getCourseRegistrationById = async (req, res, next) => {
    try {
        const registration = await courseRegistrationRepository.getCourseRegistrationById(req.params.id);
        
        if (registration) {
            return baseResponse(res, true, 200, "Course registration found", registration);
        } else {
            return baseResponse(res, false, 404, "Course registration not found", null);
        }
    } catch (error) {
        next(error);
    }
};

exports.updateCourseRegistration = async (req, res, next) => {
    try {
        const registrationId = req.params.id;
        
        // Check if registration exists
        const existingRegistration = await courseRegistrationRepository.getCourseRegistrationById(registrationId);
        if (!existingRegistration) {
            return baseResponse(res, false, 404, "Registration not found", null);
        }
        
        // Update registration
        const updatedRegistration = await courseRegistrationRepository.updateCourseRegistration({
            id: registrationId,
            ...req.body
        });
        
        return baseResponse(res, true, 200, "Course registration updated", updatedRegistration);
    } catch (error) {
        next(error);
    }
};

exports.deleteCourseRegistration = async (req, res, next) => {
    try {
        const registrationId = req.params.id;
        
        // Get registration data before deletion
        const registration = await courseRegistrationRepository.deleteCourseRegistration(registrationId);
        
        if (registration) {
            return baseResponse(res, true, 200, "Course registration deleted", registration);
        } else {
            return baseResponse(res, false, 404, "Registration not found", null);
        }
    } catch (error) {
        next(error);
    }
};
