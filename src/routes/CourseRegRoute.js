// routes/courseRegistrationRoutes.js
const express = require("express");
const courseReg = require("../repositories/repository.coursereg");
const router = express.Router();

// Create a new course registration
router.post("/create", courseReg.createCourseRegistration);

// Get all course registrations
router.get("/all", courseReg.getAllCourseRegistrations);

// Get course registration by ID
router.get("/:id", courseReg.getCourseRegistrationById);

// Update course registration
router.put("/:id", courseReg.updateCourseRegistration);

// Delete course registration
router.delete("/:id", courseReg.deleteCourseRegistration);

module.exports = router;
