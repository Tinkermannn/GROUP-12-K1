const userRepository = require('../repositories/user.repository');
const baseResponse = require('../utils/baseResponse.util');
const bcrypt = require('bcrypt');

// Regex patterns for validation
const emailRegex = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[a-zA-Z]).{8,}$/;

exports.createUser = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate email format
        if (!emailRegex.test(email)) {
            return baseResponse(res, false, 400, "Format email tidak valid", null);
        }

        // Validate password strength
        if (!passwordRegex.test(password)) {
            return baseResponse(res, false, 400, "Password harus minimal 8 karakter dan mengandung huruf, angka, dan karakter khusus", null);
        }

        // Check if username or email already exists
        const usernameExists = await userRepository.findByUsername(username);
        const emailExists = await userRepository.findByEmail(email);

        if (usernameExists) {
            return baseResponse(res, false, 400, "Username sudah terdaftar", null);
        }

        if (emailExists) {
            return baseResponse(res, false, 400, "Email sudah terdaftar", null);
        }

        // Create user
        const savedUser = await userRepository.createUser({
            username,
            email,
            password,
            role
        });

        return baseResponse(res, true, 201, "User berhasil dibuat", savedUser);
    } catch (error) {
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await userRepository.getAllUsers();
        return baseResponse(res, true, 200, "Users fetched", users);
    } catch (error) {
        next(error);
    }
};

exports.getUserById = async (req, res, next) => {
    try {
        const user = await userRepository.getUserById(req.params.id);
        
        if (user) {
            return baseResponse(res, true, 200, "User found", user);
        } else {
            return baseResponse(res, false, 404, "User tidak ditemukan", null);
        }
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { username, email, password, role } = req.body;
        
        // Check if user exists
        const existingUser = await userRepository.getUserById(userId);
        if (!existingUser) {
            return baseResponse(res, false, 404, "User tidak ditemukan", null);
        }
        console.log(emailRegex.test(email)); // should print true

        // Validate email if provided
        if (email && !emailRegex.test(email)) {
            return baseResponse(res, false, 400, "Format email tidak valid", null);
        }
        
        // Validate password if provided
        if (password && !passwordRegex.test(password)) {
            return baseResponse(res, false, 400, "Password harus minimal 8 karakter dan mengandung huruf, angka, dan karakter khusus", null);
        }
        
        // Update user - CORRECTED CALL
        const updatedUser = await userRepository.updateUser(userId, { // <--- THIS LINE WAS CHANGED
            username,
            email,
            password,
            role
        });
        
        return baseResponse(res, true, 200, "User berhasil diupdate", updatedUser);
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        
        // Delete user
        const deletedUser = await userRepository.deleteUser(userId);
        
        if (deletedUser) {
            return baseResponse(res, true, 200, "User berhasil dihapus", deletedUser);
        } else {
            return baseResponse(res, false, 404, "User tidak ditemukan", null);
        }
    } catch (error) {
        next(error);
    }
};

exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email format
        if (!emailRegex.test(email)) {
            return baseResponse(res, false, 400, "Format email tidak valid", null);
        }

        // Get user with password for comparison
        const user = await userRepository.findUserByEmailWithPassword(email);
        
        if (!user) {
            return baseResponse(res, false, 400, "Email atau password salah", null);
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return baseResponse(res, false, 400, "Email atau password salah", null);
        }

        // Remove password from response
        const { password: userPassword, ...userWithoutPassword } = user;

        return baseResponse(res, true, 200, "Login berhasil", userWithoutPassword);
    } catch (error) {
        next(error);
    }
};
