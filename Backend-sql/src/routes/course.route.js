const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');

// Basic CRUD routes
router.post('/create', courseController.createCourse);
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

// NEW COMPLEX QUERY ROUTE
router.get('/details/full', courseController.getCoursesWithDetails);

module.exports = router;
