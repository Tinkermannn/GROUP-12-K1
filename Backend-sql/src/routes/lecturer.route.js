const express = require('express');
const router = express.Router();
const lecturerController = require('../controllers/lecturer.controller');

// Lecturer routes
router.post('/create', lecturerController.createLecturer);
router.get('/', lecturerController.getAllLecturers);
router.get('/:id', lecturerController.getLecturerById);
router.put('/:id', lecturerController.updateLecturer);
router.delete('/:id', lecturerController.deleteLecturer);

module.exports = router;