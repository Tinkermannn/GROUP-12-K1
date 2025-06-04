const express = require('express');
const router = express.Router();
const studentRepository = require('../repositories/repository.student'); // Using repository directly as per your structure

// Basic CRUD routes
router.post('/create', studentRepository.createStudent);
router.get('/', studentRepository.getAllStudents);
router.get('/:id', studentRepository.getStudentById);
router.put('/:id', studentRepository.updateStudent);
router.delete('/:id', studentRepository.deleteStudent);

// NEW COMPLEX QUERY ROUTE
router.get('/details/full', studentRepository.getStudentsWithDetailsAndCourses);

module.exports = router;
