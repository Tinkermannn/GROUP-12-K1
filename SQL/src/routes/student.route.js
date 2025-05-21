const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');

// Student routes
router.post('/create', studentController.createStudent);
router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router;