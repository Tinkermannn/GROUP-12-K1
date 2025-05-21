const express = require("express");
const courseRepo = require("../repositories/repository.course");
const router = express.Router();

// Get all courses
router.get("/", courseRepo.getAllCourses);

// Get course by ID
router.get("/:id", courseRepo.getCourseById);

// Add a new course
router.post("/create", courseRepo.createCourse);

// Update course
router.put("/:id", courseRepo.updateCourse);

// Delete course
router.delete("/:id", courseRepo.deleteCourse);

module.exports = router;
