const courseRepository = require('../repositories/course.repository');
const lecturerRepository = require('../repositories/lecturer.repository'); // Needed for lecturer_id validation
const baseResponse = require('../utils/baseResponse.util');

exports.createCourse = async (req, res, next) => {
    try {
        const { course_code, name, credits, semester, lecturer_id, prerequisiteIds } = req.body;

        if (!course_code || !name || !credits || !semester || !lecturer_id) {
            return baseResponse(res, false, 400, "Missing required fields", null);
        }

        // Validate lecturer_id
        const lecturerExists = await lecturerRepository.getLecturerById(lecturer_id);
        if (!lecturerExists) {
            return baseResponse(res, false, 400, "Lecturer not found", null);
        }

        // Validate prerequisites if provided
        if (prerequisiteIds && prerequisiteIds.length > 0) {
            for (const prereqId of prerequisiteIds) {
                const prereqExists = await courseRepository.getCourseById(prereqId); // Check if prerequisite course exists
                if (!prereqExists) {
                    return baseResponse(res, false, 400, `Prerequisite course with ID ${prereqId} not found`, null);
                }
            }
        }

        const course = await courseRepository.createCourse({
            course_code,
            name,
            credits,
            semester,
            lecturer_id,
            prerequisites: prerequisiteIds // Pass as prerequisites to repository
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
        const { lecturer_id, prerequisiteIds } = req.body;

        const existingCourse = await courseRepository.getCourseById(courseId);
        if (!existingCourse) {
            return baseResponse(res, false, 404, "Course not found", null);
        }

        // Validate lecturer_id if provided
        if (lecturer_id !== undefined) {
            const lecturerExists = await lecturerRepository.getLecturerById(lecturer_id);
            if (!lecturerExists) {
                return baseResponse(res, false, 400, "Lecturer not found", null);
            }
        }

        // Validate prerequisites if provided
        if (prerequisiteIds !== undefined && prerequisiteIds.length > 0) {
            for (const prereqId of prerequisiteIds) {
                const prereqExists = await courseRepository.getCourseById(prereqId);
                if (!prereqExists) {
                    return baseResponse(res, false, 400, `Prerequisite course with ID ${prereqId} not found`, null);
                }
            }
        }


        const updatedCourse = await courseRepository.updateCourse({
            id: courseId,
            ...req.body,
            prerequisites: prerequisiteIds // Pass to repository
        });
        return baseResponse(res, true, 200, "Course updated", updatedCourse);
    } catch (error) {
        next(error);
    }
};

exports.deleteCourse = async (req, res, next) => {
    try {
        const courseId = req.params.id;
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

// NEW COMPLEX QUERY: Get All Courses with Lecturer Details and Prerequisite Course Names
exports.getCoursesWithDetails = async (req, res, next) => {
    try {
        const courses = await courseRepository.getCoursesWithDetails();
        return baseResponse(res, true, 200, "Courses with details fetched", courses);
    } catch (error) {
        next(error);
    }
};
