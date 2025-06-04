const Course = require("../models/CourseModel");
const Lecturer = require("../models/LecturerModel");
const mongoose = require('mongoose');

async function createCourse(req, res) {
    try {
        const { lecturer, prerequisites } = req.body;
        let lecturerIdAsObjectId;
        let prerequisiteIdsAsObjectIds = [];

        // Validate and cast lecturer ID to ObjectId
        if (!lecturer) {
            return res.status(400).json({ success: false, message: "Lecturer ID is required." });
        }
        if (!mongoose.Types.ObjectId.isValid(lecturer)) {
            return res.status(400).json({ success: false, message: "Invalid lecturer ID format." });
        }
        lecturerIdAsObjectId = new mongoose.Types.ObjectId(lecturer);

        // Validate and cast prerequisites
        if (prerequisites && Array.isArray(prerequisites)) {
            for (const prereqId of prerequisites) {
                if (!mongoose.Types.ObjectId.isValid(prereqId)) {
                    return res.status(400).json({ success: false, message: `Invalid prerequisite ID format: ${prereqId}` });
                }
                prerequisiteIdsAsObjectIds.push(new mongoose.Types.ObjectId(prereqId));
            }
        }

        const course = new Course({
            ...req.body,
            lecturer: lecturerIdAsObjectId,
            prerequisites: prerequisiteIdsAsObjectIds
        });
        const saved = await course.save();
        res.status(201).json({ success: true, data: saved });
    } catch (err) {
        const statusCode = err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500;
        res.status(statusCode).json({ success: false, message: err.message });
    }
}

async function getAllCourses(req, res) {
    try {
        const courses = await Course.find().populate("lecturer").sort({ updatedAt: -1 });
        res.status(200).json({ success: true, data: courses });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function getCourseById(req, res) {
    try {
        const course = await Course.findById(req.params.id).populate("lecturer").populate("prerequisites");
        if (!course) throw new Error("Course not found");
        res.status(200).json({ success: true, data: course });
    } catch (err) {
        const statusCode = err.name === 'CastError' ? 400 : 404;
        res.status(statusCode).json({ success: false, message: err.message });
    }
}

async function updateCourse(req, res) {
    try {
        const { lecturer, prerequisites } = req.body;
        let updateBody = { ...req.body };

        if (lecturer !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(lecturer)) {
                return res.status(400).json({ success: false, message: "Invalid lecturer ID format for update." });
            }
            updateBody.lecturer = new mongoose.Types.ObjectId(lecturer);
        }

        if (prerequisites !== undefined && Array.isArray(prerequisites)) {
            let prerequisiteIdsAsObjectIds = [];
            for (const prereqId of prerequisites) {
                if (!mongoose.Types.ObjectId.isValid(prereqId)) {
                    return res.status(400).json({ success: false, message: `Invalid prerequisite ID format: ${prereqId}` });
                }
                prerequisiteIdsAsObjectIds.push(new mongoose.Types.ObjectId(prereqId));
            }
            updateBody.prerequisites = prerequisiteIdsAsObjectIds;
        }

        const updated = await Course.findByIdAndUpdate(req.params.id, updateBody, { new: true });
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        const statusCode = err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500;
        res.status(statusCode).json({ success: false, message: err.message });
    }
}

async function deleteCourse(req, res) {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) throw new Error("Course not found");
        res.status(200).json({ success: true, message: "Course deleted", data: course });
    } catch (err) {
        const statusCode = err.name === 'CastError' ? 400 : 500;
        res.status(statusCode).json({ success: false, message: err.message });
    }
}

async function getCoursesWithDetails(req, res) {
    try {
        const courses = await Course.aggregate([
            {
                $lookup: {
                    from: 'lecturers',
                    localField: 'lecturer',
                    foreignField: '_id',
                    as: 'lecturerDetails'
                }
            },
            { $unwind: '$lecturerDetails' },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'prerequisites',
                    foreignField: '_id',
                    as: 'prerequisiteDetails'
                }
            },
            {
                $project: {
                    _id: 1,
                    course_code: 1,
                    name: 1,
                    credits: 1,
                    semester: 1,
                    lecturer_name: '$lecturerDetails.name',
                    lecturer_department: '$lecturerDetails.department',
                    prerequisites: {
                        $map: {
                            input: '$prerequisiteDetails',
                            as: 'prereq',
                            in: {
                                id: '$$prereq._id',
                                name: '$$prereq.name'
                            }
                        }
                    }
                }
            },
            { $sort: { name: 1 } }
        ]);
        res.status(200).json({ success: true, data: courses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    getCoursesWithDetails
};
