const express = require('express');
const router = express.Router();
const courseRegistrationController = require('../controllers/coursereg.controller');

// Course Registration routes
router.post('/create', courseRegistrationController.createCourseRegistration);
router.get('/', courseRegistrationController.getAllCourseRegistrations);
router.get('/:id', courseRegistrationController.getCourseRegistrationById);
router.put('/:id', courseRegistrationController.updateCourseRegistration);
router.delete('/:id', courseRegistrationController.deleteCourseRegistration);

module.exports = router;