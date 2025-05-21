const express = require("express");
const lecturerRepo = require("../repositories/repository.lecturer");
const router = express.Router();

// Get all lecturers
router.get("/", lecturerRepo.getAllLecturers);

// Get lecturer by ID
router.get("/:id", lecturerRepo.getLecturerById);

// Add new lecturer
router.post("/create", lecturerRepo.createLecturer);

// Update lecturer
router.put("/:id", lecturerRepo.updateLecturer);

// Delete lecturer
router.delete("/:id", lecturerRepo.deleteLecturer);

module.exports = router;
