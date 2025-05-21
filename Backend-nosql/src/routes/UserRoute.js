const express = require("express");
const userRepo = require("../repositories/repository.user");
const router = express.Router();

// Get all users
router.get("/", userRepo.getAllUsers);

// Get user by ID
router.get("/:id", userRepo.getUserById);

// Create new user
router.post("/create", userRepo.createUser);

// Update user
router.put("/:id", userRepo.updateUser);

// Delete user
router.delete("/:id", userRepo.deleteUser);

// Login user
router.post("/login", userRepo.loginUser);

module.exports = router;
