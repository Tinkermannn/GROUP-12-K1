// routes/studentRoutes.js
const express = require("express");
const studentRepo = require("../repositories/repository.student");
const router = express.Router();

// Get all students
router.get("/", studentRepo.getAllStudents);

// Get student by ID
router.get("/:id", studentRepo.getStudentById);

// Add new student
router.post("/create", studentRepo.createStudent);

// Update student by ID
router.put("/:id", studentRepo.updateStudent);

// Delete student by ID
router.delete("/:id", studentRepo.deleteStudent);

module.exports = router;
