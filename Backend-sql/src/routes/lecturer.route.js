const express = require('express');
const router = express.Router();
const lecturerController = require('../controllers/lecturer.controller');

// Basic CRUD routes
router.post('/create', lecturerController.createLecturer);
router.get('/', lecturerController.getAllLecturers);
router.get('/:id', lecturerController.getLecturerById);
router.put('/:id', lecturerController.updateLecturer);
router.delete('/:id', lecturerController.deleteLecturer);

// NEW COMPLEX QUERY ROUTE
router.get('/details/course-count', lecturerController.getLecturersWithCourseCount);

module.exports = router;
