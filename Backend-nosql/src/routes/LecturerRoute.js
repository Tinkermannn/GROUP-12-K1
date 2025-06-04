const express = require('express');
const router = express.Router();
const lecturerRepository = require('../repositories/repository.lecturer'); // Using repository directly as per your structure

// Basic CRUD routes
router.post('/create', lecturerRepository.createLecturer);
router.get('/', lecturerRepository.getAllLecturers);
router.get('/:id', lecturerRepository.getLecturerById);
router.put('/:id', lecturerRepository.updateLecturer);
router.delete('/:id', lecturerRepository.deleteLecturer);

// NEW COMPLEX QUERY ROUTE
router.get('/details/course-count', lecturerRepository.getLecturersWithCourseCount);

module.exports = router;
