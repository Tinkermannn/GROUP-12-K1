const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');

// Basic CRUD routes
router.post('/create', studentController.createStudent);
router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

// NEW COMPLEX QUERY ROUTE
router.get('/details/full', studentController.getStudentsWithDetailsAndCourses);

module.exports = router;
