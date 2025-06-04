const Student = require("../models/StudentModel");
const User = require("../models/UserModel");
const CourseRegistration = require("../models/CourseRegModel"); // Corrected model name
const Course = require("../models/CourseModel");
const mongoose = require('mongoose');

async function createStudent(req, res) {
    try {
        const { user, nim, name, major, semester } = req.body;

        // Validate and cast user ID to ObjectId
        if (!user) {
            return res.status(400).json({ success: false, message: "User ID is required." });
        }
        if (!mongoose.Types.ObjectId.isValid(user)) {
            return res.status(400).json({ success: false, message: "Invalid user ID format." });
        }
        const userIdAsObjectId = new mongoose.Types.ObjectId(user);
        
        const student = new Student({ user: userIdAsObjectId, nim, name, major, semester });
        const saved = await student.save();
        res.status(201).json({ success: true, data: saved });
    } catch (err) {
        const statusCode = err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500;
        res.status(statusCode).json({ success: false, message: err.message });
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
        const statusCode = err.name === 'CastError' ? 400 : 404;
        res.status(statusCode).json({ success: false, message: err.message });
    }
}

async function updateStudent(req, res) {
    try {
        const { user } = req.body;
        let updateBody = { ...req.body };

        if (user !== undefined) { // Only process if user field is provided in update
            if (!mongoose.Types.ObjectId.isValid(user)) {
                return res.status(400).json({ success: false, message: "Invalid user ID format for update." });
            }
            updateBody.user = new mongoose.Types.ObjectId(user);
        }

        const updated = await Student.findByIdAndUpdate(req.params.id, updateBody, { new: true });
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        const statusCode = err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500;
        res.status(statusCode).json({ success: false, message: err.message });
    }
}

async function deleteStudent(req, res) {
    try {
        const student = await Student.findById(req.params.id).populate("user");
        if (!student) throw new Error("Student not found");
        await Student.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Student deleted", data: student });
    } catch (err) {
        const statusCode = err.name === 'CastError' ? 400 : 500;
        res.status(statusCode).json({ success: false, message: err.message });
    }
}

async function getStudentsWithDetailsAndCourses(req, res) {
    try {
        const students = await Student.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: '$userDetails' },
            {
                $lookup: {
                    from: 'courseregs',
                    localField: '_id',
                    foreignField: 'student',
                    as: 'registrations'
                }
            },
            {
                $unwind: { path: '$registrations', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'registrations.course',
                    foreignField: '_id',
                    as: 'courseDetails'
                }
            },
            {
                $unwind: { path: '$courseDetails', preserveNullAndEmptyArrays: true }
            },
            {
                $group: {
                    _id: '$_id',
                    nim: { $first: '$nim' },
                    student_name: { $first: '$name' },
                    major: { $first: '$major' },
                    semester: { $first: '$semester' },
                    username: { $first: '$userDetails.username' },
                    email: { $first: '$userDetails.email' },
                    registered_courses: {
                        $push: {
                            $cond: {
                                if: '$registrations._id',
                                then: {
                                    registration_id: '$registrations._id',
                                    course_id: '$courseDetails._id',
                                    course_code: '$courseDetails.course_code',
                                    course_name: '$courseDetails.name',
                                    credits: '$courseDetails.credits',
                                    academic_year: '$registrations.academic_year',
                                    registration_semester: '$registrations.semester',
                                    status: '$registrations.status'
                                },
                                else: '$$REMOVE'
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    nim: 1,
                    student_name: 1,
                    major: 1,
                    semester: 1,
                    username: 1,
                    email: 1,
                    registered_courses: {
                        $cond: {
                            if: { $eq: ['$registered_courses', [{}]] },
                            then: [],
                            else: '$registered_courses'
                        }
                    }
                }
            },
            { $sort: { student_name: 1 } }
        ]);
        res.status(200).json({ success: true, data: students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent, getStudentsWithDetailsAndCourses };
