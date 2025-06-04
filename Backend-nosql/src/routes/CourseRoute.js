const express = require('express');
const router = express.Router();
const courseRepository = require('../repositories/repository.course');

// Basic CRUD routes
router.post('/create', courseRepository.createCourse);
router.get('/', courseRepository.getAllCourses);
router.get('/:id', courseRepository.getCourseById);
router.put('/:id', courseRepository.updateCourse);
router.delete('/:id', courseRepository.deleteCourse);

// Existing Complex Query Route
router.get('/details/full', courseRepository.getCoursesWithDetails);

// NEW ROUTE FOR DENORMALIZED QUERY
router.get('/details/denormalized', courseRepository.getCoursesWithDenormalizedDetails);

module.exports = router;
