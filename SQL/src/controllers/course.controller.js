const courseRepository = require('../repositories/course.repository');
const baseResponse = require('../utils/baseResponse.util');

exports.createCourse = async (req, res, next) => {
    try {
        const { course_code, name, credits, semester, lecturer_id, prerequisites } = req.body;

        // Validate required fields
        if (!course_code || !name || !credits || !semester || !lecturer_id) {
            return baseResponse(res, false, 400, "Missing required fields", null);
        }

        // Validate prerequisites if provided
        if (prerequisites && prerequisites.length > 0) {
            const foundPrereqs = await courseRepository.findByCourseIds(prerequisites);
            
            if (foundPrereqs.length !== prerequisites.length) {
                return baseResponse(res, false, 400, "One or more prerequisite course IDs are invalid", null);
            }
        }

        // Create course
        const course = await courseRepository.createCourse({
            course_code,
            name,
            credits,
            semester,
            lecturer_id,
            prerequisites: prerequisites || []
        });

        return baseResponse(res, true, 201, "Course created", course);
    } catch (error) {
        next(error);
    }
};

exports.getAllCourses = async (req, res, next) => {
    try {
        const courses = await courseRepository.getAllCourses();
        return baseResponse(res, true, 200, "Courses fetched", courses);
    } catch (error) {
        next(error);
    }
};

exports.getCourseById = async (req, res, next) => {
    try {
        const course = await courseRepository.getCourseById(req.params.id);
        
        if (course) {
            return baseResponse(res, true, 200, "Course found", course);
        } else {
            return baseResponse(res, false, 404, "Course not found", null);
        }
    } catch (error) {
        next(error);
    }
};

exports.updateCourse = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        
        // Check if course exists
        const existingCourse = await courseRepository.getCourseById(courseId);
        if (!existingCourse) {
            return baseResponse(res, false, 404, "Course not found", null);
        }
        
        // Update course
        const updatedCourse = await courseRepository.updateCourse({
            id: courseId,
            ...req.body
        });
        
        return baseResponse(res, true, 200, "Course updated", updatedCourse);
    } catch (error) {
        next(error);
    }
};

exports.deleteCourse = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        
        // Delete course and get its data
        const deletedCourse = await courseRepository.deleteCourse(courseId);
        
        if (deletedCourse) {
            return baseResponse(res, true, 200, "Course deleted", deletedCourse);
        } else {
            return baseResponse(res, false, 404, "Course not found", null);
        }
    } catch (error) {
        next(error);
    }
};