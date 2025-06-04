const express = require('express');
const router = express.Router();
const courseRepository = require('../repositories/repository.course'); // Using repository directly as per your structure

// Basic CRUD routes
router.post('/create', courseRepository.createCourse);
router.get('/', courseRepository.getAllCourses);
router.get('/:id', courseRepository.getCourseById);
router.put('/:id', courseRepository.updateCourse);
router.delete('/:id', courseRepository.deleteCourse);

// NEW COMPLEX QUERY ROUTE
router.get('/details/full', courseRepository.getCoursesWithDetails);

module.exports = router;
